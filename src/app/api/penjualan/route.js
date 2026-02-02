import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Pastikan model 'penjualan' diakses dengan huruf kecil (sesuai Prisma Client)
    const sales = await prisma.penjualan.findMany({
      include: {
        customer: {
          select: { name: true }
        },
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedData = sales.map((sale) => ({
      id: sale.invoiceId,
      dbId: sale.id,
      customer: sale.customer?.name || "Pelanggan Umum",
      date: sale.createdAt ? sale.createdAt.toISOString().split('T')[0] : "-",
      total: sale.totalAmount || 0,
      status: sale.status,
      itemCount: sale.items?.length || 0
    }));

    return NextResponse.json(formattedData, { status: 200 });
  } catch (error) {
    console.error("API_GET_SALES_ERROR:", error);
    // Mengembalikan detail error agar kita tahu kolom mana yang dianggap hilang
    return NextResponse.json({ 
      message: "Gagal mengambil data penjualan",
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, customerId, totalAmount, items } = body;

    // Validasi dasar data
    if (!items || items.length === 0) {
      return NextResponse.json({ message: "Item penjualan tidak boleh kosong" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat Penjualan
      const sale = await tx.penjualan.create({
        data: {
          invoiceId,
          totalAmount: parseFloat(totalAmount),
          status: 'COMPLETED',
          customerId,
          items: {
            create: items.map((item) => ({
              productName: item.name,
              quantity: parseFloat(item.quantity),
              price: parseFloat(item.price),
            })),
          },
        },
        include: { items: true }
      });

      // 2. Update Stok & History
      for (const item of items) {
        // Gunakan updateMany untuk menghindari error jika item tidak ditemukan secara unik
        await tx.stock.updateMany({
          where: { name: item.name },
          data: {
            stock: {
              decrement: parseFloat(item.quantity)
            }
          }
        });

        await tx.history.create({
          data: {
            action: "PENJUALAN",
            item: item.name,
            category: "Sales",
            type: "OUT",
            quantity: parseFloat(item.quantity),
            user: session.user.username || "System",
            notes: `Invoice: ${invoiceId}`,
            referenceId: sale.id
          }
        });
      }

      return sale;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("API_POST_SALES_ERROR:", error);
    return NextResponse.json({ 
      message: "Gagal memproses transaksi", 
      details: error.message 
    }, { status: 500 });
  }
}