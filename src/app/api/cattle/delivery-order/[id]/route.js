// app/api/cattle/delivery-order/[id]/route.js
//
// GET    /api/cattle/delivery-order/:id  — detail DO
// PATCH  /api/cattle/delivery-order/:id  — update status DO
// DELETE /api/cattle/delivery-order/:id  — hapus DO (hanya DRAFT/REJECTED)

import { NextResponse }    from "next/server";
import prisma              from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions }     from "@/app/api/auth/[...nextauth]/route";

// ─── GET by ID ────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const doOrder = await prisma.cattleDeliveryOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            breed: true,
            purchasingOrders: {
              include: {
                purchasing: {
                  select: {
                    id: true,
                    noPO: true,
                    vendorName: true,
                    status: true,
                    isReceived: true,
                    totalHeadOrdered: true,
                    totalWeightKg: true,
                  }
                }
              }
            }
          }
        }
      },
    });

    if (!doOrder) {
      return NextResponse.json({ message: "DO tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json(doOrder);
  } catch (err) {
    console.error("CATTLE_DO_GET_ID:", err.message);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── PATCH (Update Status) ────────────────────────────────────────────────────
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    if (!["SuperAdmin","Supervisor","Manager"].includes(session.user.role)) {
      return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;
    
    let status, notes;
    try {
      const body = await request.json();
      status = body.status;
      notes = body.notes;
    } catch (e) {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ message: "Status harus diisi (APPROVED / REJECTED)" }, { status: 400 });
    }

    const normalizedStatus = status.toUpperCase();
    if (!["APPROVED", "REJECTED"].includes(normalizedStatus)) {
      return NextResponse.json({ message: "Status harus APPROVED atau REJECTED" }, { status: 400 });
    }

    const userName = session.user.name || session.user.email;

    const doOrder = await prisma.cattleDeliveryOrder.findUnique({ 
      where: { id } 
    });
    
    if (!doOrder) {
      return NextResponse.json({ message: "DO tidak ditemukan." }, { status: 404 });
    }

    if (doOrder.status !== "PENDING") {
      return NextResponse.json({ 
        message: `DO dalam status ${doOrder.status}, tidak dapat di-${normalizedStatus.toLowerCase()}. Hanya DO dengan status PENDING yang dapat di-approve/reject.` 
      }, { status: 400 });
    }

    const updated = await prisma.cattleDeliveryOrder.update({
      where: { id },
      data: {
        status: normalizedStatus,
        approvedBy: normalizedStatus === "APPROVED" ? userName : undefined,
        approvedAt: normalizedStatus === "APPROVED" ? new Date() : undefined,
        rejectedBy: normalizedStatus === "REJECTED" ? userName : undefined,
        rejectedAt: normalizedStatus === "REJECTED" ? new Date() : undefined,
        rejectedNotes: normalizedStatus === "REJECTED" ? (notes || "") : undefined,
      },
      include: { items: true },
    });

    await prisma.history.create({
      data: {
        action: `CATTLE_DO_${normalizedStatus}`,
        item: doOrder.doNo,
        category: "Cattle",
        type: "LIVESTOCK",
        quantity: 1,
        unit: "DO",
        user: userName,
        referenceId: id,
        notes: `DO ${doOrder.doNo} → ${normalizedStatus}. ${notes || ""}`,
      },
    });

    return NextResponse.json({ 
      message: `DO ${doOrder.doNo} berhasil di-${normalizedStatus.toLowerCase()}.`, 
      data: updated 
    });
  } catch (err) {
    console.error("CATTLE_DO_PATCH:", err.message);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    
    if (!["SuperAdmin","Admin"].includes(session.user.role)) {
      return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;
    
    const doOrder = await prisma.cattleDeliveryOrder.findUnique({ 
      where: { id } 
    });
    
    if (!doOrder) {
      return NextResponse.json({ message: "DO tidak ditemukan." }, { status: 404 });
    }
    
    if (!["DRAFT","REJECTED"].includes(doOrder.status)) {
      return NextResponse.json({ 
        message: `Hanya DO dengan status DRAFT atau REJECTED yang bisa dihapus. Status saat ini: ${doOrder.status}` 
      }, { status: 400 });
    }

    await prisma.cattleDeliveryOrder.delete({ where: { id } });
    
    return NextResponse.json({ message: `DO ${doOrder.doNo} berhasil dihapus.` });
  } catch (err) {
    console.error("CATTLE_DO_DELETE:", err.message);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}