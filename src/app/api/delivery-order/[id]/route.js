// app/api/delivery-order/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/delivery-order/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const do_ = await prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            purchasingOrders: {
              include: {
                receipts: {
                  select: { id: true, receiptNo: true, receivedQty: true, receivedAt: true, receivedBy: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
    if (!do_) return NextResponse.json({ message: "DO tidak ditemukan" }, { status: 404 });
    return NextResponse.json(do_);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PATCH /api/delivery-order/[id]
// action: "approve" | "reject" | undefined (edit)
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id }     = await params;
    const body       = await request.json();
    const { action } = body;
    const isAdmin    = ["Admin", "Supervisor"].includes(session.user.role);

    const existing = await prisma.deliveryOrder.findUnique({
      where: { id }, include: { items: true },
    });
    if (!existing) return NextResponse.json({ message: "DO tidak ditemukan" }, { status: 404 });

    // ── APPROVE ───────────────────────────────────────────────────────────────
    if (action === "approve") {
      if (!isAdmin) return NextResponse.json({ message: "Hanya Admin/Supervisor" }, { status: 403 });
      if (existing.status !== "PENDING") {
        return NextResponse.json({ message: "Hanya DO PENDING yang bisa di-approve" }, { status: 400 });
      }
      const updated = await prisma.deliveryOrder.update({
        where: { id },
        data: {
          status:     "APPROVED",
          approvedBy: session.user.name || session.user.email,
          approvedAt: new Date(),
        },
        include: { items: { include: { purchasingOrders: { select: { id: true, noPO: true, status: true } } } } },
      });
      return NextResponse.json(updated);
    }

    // ── REJECT ────────────────────────────────────────────────────────────────
    if (action === "reject") {
      if (!isAdmin) return NextResponse.json({ message: "Hanya Admin/Supervisor" }, { status: 403 });
      if (!["PENDING", "DRAFT"].includes(existing.status)) {
        return NextResponse.json({ message: "Hanya DO PENDING/DRAFT yang bisa di-reject" }, { status: 400 });
      }
      const updated = await prisma.deliveryOrder.update({
        where: { id },
        data: {
          status:     "REJECTED",
          approvedBy: session.user.name || session.user.email,
          approvedAt: new Date(),
        },
        include: { items: true },
      });
      return NextResponse.json(updated);
    }

    // ── EDIT (hanya DRAFT / PENDING) ──────────────────────────────────────────
    if (!action) {
      if (!["DRAFT", "PENDING"].includes(existing.status)) {
        return NextResponse.json({ message: "Hanya DO DRAFT/PENDING yang dapat diedit" }, { status: 400 });
      }
      const { title, expectedDate, notes, items } = body;

      const updated = await prisma.$transaction(async (tx) => {
        await tx.deliveryOrder.update({
          where: { id },
          data: {
            title:        title        ?? existing.title,
            expectedDate: expectedDate ? new Date(expectedDate) : existing.expectedDate,
            notes:        notes        ?? existing.notes,
          },
        });

        // Ganti semua item jika disertakan
        if (items) {
          // Hanya boleh edit item jika belum ada PO yang dibuat
          const hasPO = await tx.purchasing.count({ where: { deliveryOrderItem: { deliveryOrderId: id } } });
          if (hasPO > 0) {
            throw new Error("Tidak bisa edit item DO yang sudah punya PO. Edit qty lewat item update.");
          }
          await tx.deliveryOrderItem.deleteMany({ where: { deliveryOrderId: id } });
          await tx.deliveryOrderItem.createMany({
            data: items.map(i => ({
              deliveryOrderId: id,
              itemName:        i.itemName.trim(),
              category:        i.category || "",
              type:            i.type     || "STOCKS",
              unit:            i.unit.trim(),
              qtyRequired:     parseFloat(i.qtyRequired) || 0,
              qtyOrdered:      0,
              estimasiHarga:   parseFloat(i.estimasiHarga) || 0,
              notes:           i.notes || "",
            })),
          });
        }

        return tx.deliveryOrder.findUnique({
          where: { id },
          include: { items: { include: { purchasingOrders: { select: { id: true, noPO: true } } } } },
        });
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ message: "Action tidak dikenal" }, { status: 400 });
  } catch (error) {
    console.error("DO_PATCH_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE /api/delivery-order/[id] — hanya DRAFT/PENDING tanpa PO
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id }   = await params;
    const existing = await prisma.deliveryOrder.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ message: "DO tidak ditemukan" }, { status: 404 });
    if (!["DRAFT", "PENDING"].includes(existing.status)) {
      return NextResponse.json({ message: "Hanya DO DRAFT/PENDING yang bisa dihapus" }, { status: 400 });
    }

    // Pastikan belum ada PO
    const hasPO = await prisma.purchasing.count({ where: { deliveryOrderItem: { deliveryOrderId: id } } });
    if (hasPO > 0) {
      return NextResponse.json({ message: "DO sudah punya PO, tidak bisa dihapus" }, { status: 400 });
    }

    await prisma.deliveryOrder.delete({ where: { id } });
    return NextResponse.json({ message: "DO berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
