// app/api/cattle/purchasing/[id]/approve/route.js
//
// PATCH { status: "APPROVED" | "PENDING" | "CANCELLED", notes? }

import { NextResponse }    from "next/server";
import prisma              from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions }     from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id }         = await params;
    const { status, notes } = await request.json();
    const userName       = session.user.name || session.user.email;
    const role           = session.user.role;

    const isAuthorized = ["SuperAdmin", "Supervisor", "Manager"].includes(role);
    if (!isAuthorized) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });

    const validStatuses = ["APPROVED", "PENDING", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: `Status tidak valid. Gunakan: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const po = await prisma.cattlePurchasing.findUnique({ where: { id } });
    if (!po) return NextResponse.json({ message: "PO tidak ditemukan." }, { status: 404 });
    if (po.isReceived) return NextResponse.json({ message: "PO terkunci — sudah ada arrival." }, { status: 400 });

    const [updated] = await prisma.$transaction([
      prisma.cattlePurchasing.update({
        where: { id },
        data: {
          status,
          approvedBy: status === "PENDING" ? null : userName,
          approvedAt: status === "PENDING" ? null : new Date(),
          notes:      notes ? (po.notes ? `${po.notes} | ${notes}` : notes) : po.notes,
        },
      }),
      prisma.history.create({
        data: {
          action:      status === "APPROVED" ? "CATTLE_PO_APPROVED" : status === "CANCELLED" ? "CATTLE_PO_CANCELLED" : "CATTLE_PO_REVOKED",
          item:        `${po.totalHeadOrdered} ekor - ${po.vendorName}`,
          category:    "Cattle",
          type:        "LIVESTOCK",
          quantity:    po.totalHeadOrdered,
          unit:        "EKOR",
          user:        userName,
          referenceId: id,
          notes:       `PO ${po.noPO} → ${status}. ${notes || ""}`,
        },
      }),
    ]);

    return NextResponse.json({ message: `PO ${po.noPO} berhasil di-${status.toLowerCase()}.`, data: updated });
  } catch (err) {
    console.error("CATTLE_PO_APPROVE:", err.message);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
