// app/api/purchasing/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { recalcDOStatus } from "@/app/api/delivery-order/route";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const po = await prisma.purchasing.findUnique({
      where: { id },
      include: {
        receipts: true,
        deliveryOrderItem: {
          include: { deliveryOrder: { select: { id: true, doNo: true, status: true } } },
        },
      },
    });
    if (!po) return NextResponse.json({ message: "PO tidak ditemukan" }, { status: 404 });
    return NextResponse.json(po, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.purchasing.findUnique({
      where: { id },
      include: { deliveryOrderItem: { select: { id: true, deliveryOrderId: true } } },
    });
    if (!existing) return NextResponse.json({ message: "Data PO tidak ditemukan" }, { status: 404 });
    if (existing.isReceived) {
      return NextResponse.json({ message: "PO ini sudah diterima/masuk gudang, tidak bisa dihapus" }, { status: 400 });
    }

    const doItemId = existing.deliveryOrderItem?.id;
    const doId     = existing.deliveryOrderItem?.deliveryOrderId;
    const qty      = existing.qty;

    await prisma.$transaction(async (tx) => {
      await tx.purchasing.delete({ where: { id } });

      // Jika PO ini berasal dari DO, kurangi qtyOrdered dan recalc status DO
      if (doItemId && doId) {
        await tx.deliveryOrderItem.update({
          where: { id: doItemId },
          data:  { qtyOrdered: { decrement: qty } },
        });
        await recalcDOStatus(tx, doId);
      }
    });

    return NextResponse.json({ message: "PO berhasil dihapus" }, { status: 200 });
  } catch (error) {
    console.error("DELETE_PO_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
