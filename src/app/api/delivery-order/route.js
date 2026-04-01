// app/api/delivery-order/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Nomor DO otomatis: DO-YYYYMM-XXXX
const generateDONo = async () => {
  const now = new Date();
  const prefix = `DO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count = await prisma.deliveryOrder.count({
    where: { doNo: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
};

// GET /api/delivery-order — list semua DO, urutkan terbaru
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // opsional filter

    const orders = await prisma.deliveryOrder.findMany({
      where: status ? { status } : {},
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("DO_GET_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/delivery-order — buat DO baru (status: PENDING)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { supplier, expectedDate, notes, items } = body;

    if (!supplier || !items?.length) {
      return NextResponse.json(
        { message: "supplier dan items wajib diisi" },
        { status: 400 }
      );
    }

    const doNo = await generateDONo();

    const newDO = await prisma.deliveryOrder.create({
      data: {
        doNo,
        supplier,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes: notes || "",
        requestedBy: session.user.name || session.user.email,
        status: "PENDING",
        items: {
          create: items.map((i) => ({
            description:   i.description,
            qty:           parseFloat(i.qty) || 0,
            unit:          i.unit || "Kg",
            estimasiHarga: parseFloat(i.estimasiHarga) || 0,
            notes:         i.notes || "",
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(newDO, { status: 201 });
  } catch (error) {
    console.error("DO_POST_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
