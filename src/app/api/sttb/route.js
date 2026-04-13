// app/api/sttb/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/sttb
// Query params: ?status=PENDING_QC|PENDING_SUPERVISOR|PENDING_MANAGER|APPROVED|REJECTED
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const sttbs = await prisma.sTTB.findMany({
      where: status ? { status } : {},
      include: {
        receipt: {
          select: {
            id:          true,
            receiptNo:   true,
            suratJalan:  true,
            vehicleNo:   true,
            receivedQty: true,
            grossWeight: true,
            tareWeight:  true,
            refraksi:    true,
            netWeight:   true,
            condition:   true,
            notes:       true,
            receivedBy:  true,
            receivedAt:  true,
            imageUrl:    true,
          },
        },
        purchasing: {
          select: {
            id:       true,
            noPO:     true,
            item:     true,
            qty:      true,
            unit:     true,
            price:    true,
            category: true,
            type:     true,
            supplier: true,
          },
        },
        warehouse: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sttbs);
  } catch (error) {
    console.error("STTB_GET_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
