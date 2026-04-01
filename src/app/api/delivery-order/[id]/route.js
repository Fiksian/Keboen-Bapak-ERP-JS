// app/api/delivery-order/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/delivery-order/[id] — detail satu DO
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const do_ = await prisma.deliveryOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!do_) return NextResponse.json({ message: "DO tidak ditemukan" }, { status: 404 });
    return NextResponse.json(do_);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PATCH /api/delivery-order/[id]
// Handles: approve, reject, convert-to-po, edit (draft only)
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id }   = await params;
    const body     = await request.json();
    const { action } = body;

    const existing = await prisma.deliveryOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) {
      return NextResponse.json({ message: "DO tidak ditemukan" }, { status: 404 });
    }

    const isAdmin = ["Admin", "Supervisor"].includes(session.user.role);

    // ── APPROVE ──────────────────────────────────────────────────────────────
    if (action === "approve") {
      if (!isAdmin) {
        return NextResponse.json({ message: "Hanya Admin/Supervisor yang dapat approve" }, { status: 403 });
      }
      if (existing.status !== "PENDING") {
        return NextResponse.json({ message: "Hanya DO berstatus PENDING yang bisa di-approve" }, { status: 400 });
      }
      const updated = await prisma.deliveryOrder.update({
        where: { id },
        data: {
          status:     "APPROVED",
          approvedBy: session.user.name || session.user.email,
          approvedAt: new Date(),
        },
        include: { items: true },
      });
      return NextResponse.json(updated);
    }

    // ── REJECT ───────────────────────────────────────────────────────────────
    if (action === "reject") {
      if (!isAdmin) {
        return NextResponse.json({ message: "Hanya Admin/Supervisor yang dapat reject" }, { status: 403 });
      }
      if (existing.status !== "PENDING") {
        return NextResponse.json({ message: "Hanya DO berstatus PENDING yang bisa di-reject" }, { status: 400 });
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

    // ── CONVERT TO PO ─────────────────────────────────────────────────────────
    // Hanya Admin yang bisa konversi DO → PO setelah approved
    if (action === "convert-to-po") {
      if (!isAdmin) {
        return NextResponse.json({ message: "Hanya Admin yang dapat mengkonversi DO ke PO" }, { status: 403 });
      }
      if (existing.status !== "APPROVED") {
        return NextResponse.json({ message: "DO harus berstatus APPROVED untuk dikonversi ke PO" }, { status: 400 });
      }
      if (existing.linkedPOId) {
        return NextResponse.json({ message: "DO ini sudah pernah dikonversi ke PO" }, { status: 400 });
      }

      // Buat satu PO per item DO (sesuai struktur Purchasing existing)
      // Prisma transaction: buat semua PO sekaligus, lalu update DO
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");

      const createdPOs = await prisma.$transaction(async (tx) => {
        const pos = [];
        for (let i = 0; i < existing.items.length; i++) {
          const item = existing.items[i];
          const seq  = String(i + 1).padStart(3, "0");
          const noPO = `PO-${dateStr}-${seq}-${existing.doNo.split("-").pop()}`;

          const po = await tx.purchasing.create({
            data: {
              noPO,
              supplier:    existing.supplier,
              item:        item.description,
              qty:         item.qty,
              unit:        item.unit,
              price:       item.estimasiHarga,
              category:    "Umum",        // default, bisa diubah
              type:        "STOCKS",
              status:      "PENDING",
              requestedBy: existing.requestedBy,
              // Simpan referensi DO sebagai notes
              notes:       `Dibuat dari DO: ${existing.doNo}`,
            },
          });
          pos.push(po);
        }

        // Update DO: status LINKED, simpan ID PO pertama sebagai referensi
        await tx.deliveryOrder.update({
          where: { id },
          data: {
            status:      "LINKED",
            linkedPOId:  pos[0].id,
            linkedPONo:  pos[0].noPO,
          },
        });

        return pos;
      });

      return NextResponse.json({
        message:    `${createdPOs.length} PO berhasil dibuat dari DO ${existing.doNo}`,
        purchasingOrders: createdPOs,
      });
    }

    // ── EDIT (draft / pending saja) ──────────────────────────────────────────
    if (!action) {
      if (!["DRAFT", "PENDING"].includes(existing.status)) {
        return NextResponse.json({ message: "Hanya DO Draft/Pending yang dapat diedit" }, { status: 400 });
      }
      const { supplier, expectedDate, notes, items } = body;
      const updated = await prisma.deliveryOrder.update({
        where: { id },
        data: {
          supplier:     supplier || existing.supplier,
          expectedDate: expectedDate ? new Date(expectedDate) : existing.expectedDate,
          notes:        notes ?? existing.notes,
          items: items ? {
            deleteMany: {},
            create: items.map(i => ({
              description:   i.description,
              qty:           parseFloat(i.qty) || 0,
              unit:          i.unit || "Kg",
              estimasiHarga: parseFloat(i.estimasiHarga) || 0,
              notes:         i.notes || "",
            })),
          } : undefined,
        },
        include: { items: true },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ message: "Action tidak dikenal" }, { status: 400 });

  } catch (error) {
    console.error("DO_PATCH_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE /api/delivery-order/[id] — hanya bisa hapus DO Draft/Pending
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.deliveryOrder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "DO tidak ditemukan" }, { status: 404 });
    }
    if (!["DRAFT", "PENDING"].includes(existing.status)) {
      return NextResponse.json(
        { message: "DO yang sudah diproses tidak dapat dihapus" },
        { status: 400 }
      );
    }

    await prisma.deliveryOrder.delete({ where: { id } });
    return NextResponse.json({ message: "DO berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
