// app/api/delivery-order/[id]/linked-po/route.js
// Mengambil semua PO yang terhubung ke DO ini (via DeliveryOrderItem.purchasingId)
// Response dikelompokkan per supplier untuk kemudahan tampilan
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Pastikan DO ada
    const doExists = await prisma.deliveryOrder.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!doExists) {
      return NextResponse.json({ message: "DO tidak ditemukan" }, { status: 404 });
    }

    // Ambil semua item DO beserta PO-nya dan info receipt
    const doItems = await prisma.deliveryOrderItem.findMany({
      where: { deliveryOrderId: id },
      orderBy: { createdAt: "asc" },
      include: {
        purchasing: {
          select: {
            id:         true,
            noPO:       true,
            item:       true,
            supplier:   true,
            qty:        true,
            unit:       true,
            price:      true,
            status:     true,
            isReceived: true,
            approvedBy: true,
            createdAt:  true,
            receipts: {
              select: {
                id:          true,
                receiptNo:   true,
                receivedQty: true,
                receivedAt:  true,
                receivedBy:  true,
                condition:   true,
                grossWeight: true,
                tareWeight:  true,
                netWeight:   true,
              },
              orderBy: { receivedAt: "desc" },
              take: 1,
            },
          },
        },
        warehouse: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Flatten: kembalikan list PO dengan info DO item (qtyDO, warehouse) sebagai tambahan
    const linkedPOs = doItems.map(doItem => ({
      // Data DO item
      doItemId:         doItem.id,
      qtyDO:            doItem.qtyDO,
      unit:             doItem.unit,
      estimasiHarga:    doItem.estimasiHarga,
      itemSnapshot:     doItem.itemSnapshot,
      supplierSnapshot: doItem.supplierSnapshot,
      notes:            doItem.notes,
      warehouse:        doItem.warehouse,

      // Data PO terhubung
      po: doItem.purchasing,
    }));

    // Summary per supplier
    const bySupplier = linkedPOs.reduce((acc, lp) => {
      const sup = lp.supplierSnapshot || lp.po?.supplier || "Unknown";
      if (!acc[sup]) acc[sup] = [];
      acc[sup].push(lp);
      return acc;
    }, {});

    return NextResponse.json({
      items:      linkedPOs,
      bySupplier,
      totalItems: linkedPOs.length,
    });
  } catch (error) {
    console.error("LINKED_PO_GET_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}