// app/api/cattle/purchasing/bulk-status/route.js
//
// PATCH { ids: string[], status: "APPROVED" | "CANCELLED" }

import { NextResponse }    from "next/server";
import prisma              from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions }     from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    if (!["SuperAdmin", "Supervisor", "Manager"].includes(session.user.role)) {
      return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
    }

    const { ids, status } = await request.json();
    if (!ids?.length) return NextResponse.json({ message: "IDs tidak boleh kosong." }, { status: 400 });
    if (!["APPROVED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ message: "Status harus APPROVED atau CANCELLED." }, { status: 400 });
    }

    const userName = session.user.name || session.user.email;
    const now      = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.cattlePurchasing.updateMany({
        where: { id: { in: ids }, isReceived: false },
        data: {
          status,
          approvedBy: status === "APPROVED" ? userName : undefined,
          approvedAt: status === "APPROVED" ? now : undefined,
        },
      });
      await tx.history.createMany({
        data: ids.map(id => ({
          action:      status === "APPROVED" ? "CATTLE_PO_APPROVED" : "CATTLE_PO_CANCELLED",
          item:        "Bulk Action",
          category:    "Cattle",
          type:        "LIVESTOCK",
          quantity:    1,
          unit:        "PO",
          user:        userName,
          referenceId: id,
          notes:       `Bulk ${status} oleh ${userName}`,
        })),
      });
    });

    return NextResponse.json({ message: `${ids.length} PO berhasil di-${status.toLowerCase()}.` });
  } catch (err) {
    console.error("CATTLE_BULK_STATUS:", err.message);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
