import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Authorisasi role
    if (!["SuperAdmin", "Supervisor", "Manager"].includes(session.user.role)) {
      return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await context.params;
    
    let status;
    try {
      const body = await request.json();
      status = body.status;
    } catch (e) {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: "Status tidak valid. Gunakan: PENDING, APPROVED, REJECTED" }, { status: 400 });
    }

    const userName = session.user.name || session.user.email;

    // Cek apakah PO sapi ada (bukan purchasing barang umum)
    const purchase = await prisma.cattlePurchasing.findUnique({
      where: { id }
    });

    if (!purchase) {
      return NextResponse.json({ message: "Data PO tidak ditemukan" }, { status: 404 });
    }

    if (purchase.isReceived) {
      return NextResponse.json(
        { message: "Data terkunci. Barang sudah diterima." }, 
        { status: 400 }
      );
    }

    // Cek status transisi yang valid
    if (purchase.status === 'RECEIVED') {
      return NextResponse.json(
        { message: "PO sudah RECEIVED, tidak dapat mengubah status." },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.cattlePurchasing.update({
        where: { id },
        data: { 
          status: status,
          approvedBy: status === 'PENDING' ? null : userName,
          approvedAt: status === 'PENDING' ? null : new Date(),
        },
      });

      await tx.history.create({
        data: {
          action: status === 'APPROVED' ? "CATTLE_PO_APPROVED" : 
                  status === 'REJECTED' ? "CATTLE_PO_REJECTED" : "CATTLE_PO_REVOKED",
          item: `${purchase.totalHeadOrdered} ekor - ${purchase.vendorName}`,
          category: "Cattle",
          type: "LIVESTOCK",
          quantity: purchase.totalHeadOrdered,
          unit: "EKOR",
          user: userName,
          referenceId: id,
          notes: status === 'PENDING' 
            ? `Persetujuan PO ${purchase.noPO} dibatalkan (Revoke) oleh ${userName}.`
            : `PO ${purchase.noPO} (${purchase.vendorName}) status diubah menjadi ${status} oleh ${userName}.`
        }
      });

      return updated;
    });

    return NextResponse.json({
      message: `PO ${purchase.noPO} berhasil di-${status.toLowerCase()}.`,
      data: updatedRequest
    });

  } catch (error) {
    console.error("CATTLE_PO_APPROVE_ERROR:", error);
    return NextResponse.json({ 
      message: "Gagal memperbarui status", 
      detail: error.message 
    }, { status: 500 });
  }
}