// app/api/delivery-order/approved-po/route.js
// Endpoint khusus untuk AddDOModal:
// Mengembalikan semua PO yang APPROVED dan belum pernah dimasukkan
// ke dalam DO yang sedang aktif (status PENDING atau APPROVED).
//
// Ini memungkinkan user memilih PO dari berbagai supplier
// untuk dimasukkan ke satu dokumen DO.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // PO yang APPROVED dan belum ada di item DO yang masih aktif
    // "Masih aktif" = DO berstatus PENDING atau APPROVED (belum LINKED/REJECTED)
    const activeDOItems = await prisma.deliveryOrderItem.findMany({
      where: {
        deliveryOrder: {
          status: { in: ["PENDING", "APPROVED"] },
        },
      },
      select: { purchasingId: true },
    });

    const alreadyInDO = new Set(activeDOItems.map(i => i.purchasingId));

    // Ambil PO APPROVED yang belum masuk ke DO aktif manapun
    const approvedPOs = await prisma.purchasing.findMany({
      where: {
        status:     "APPROVED",
        isReceived: false,
        id: {
          notIn: [...alreadyInDO],
        },
      },
      orderBy: [
        { supplier:  "asc"  },
        { createdAt: "desc" },
      ],
      select: {
        id:         true,
        noPO:       true,
        item:       true,
        supplier:   true,
        qty:        true,
        unit:       true,
        price:      true,
        category:   true,
        type:       true,
        status:     true,
        requestedBy:true,
        approvedBy: true,
        createdAt:  true,
      },
    });

    // Kelompokkan per supplier untuk kemudahan di dropdown
    const bySupplier = approvedPOs.reduce((acc, po) => {
      const sup = po.supplier || "Unknown";
      if (!acc[sup]) acc[sup] = [];
      acc[sup].push(po);
      return acc;
    }, {});

    return NextResponse.json({
      pos:        approvedPOs,
      bySupplier,
      total:      approvedPOs.length,
    });
  } catch (error) {
    console.error("APPROVED_PO_GET_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}