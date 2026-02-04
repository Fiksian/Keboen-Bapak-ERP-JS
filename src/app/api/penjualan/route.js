import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const generateFinanceTrxNo = async (tx) => {
  const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const lastTrx = await tx.transaction.findFirst({
    where: { trxNo: { startsWith: `TRX-${datePrefix}` } },
    orderBy: { trxNo: 'desc' }
  });

  let nextNum = "001";
  if (lastTrx) {
    const lastNum = parseInt(lastTrx.trxNo.split("-")[2]);
    nextNum = String(lastNum + 1).padStart(3, "0");
  }
  return `TRX-${datePrefix}-${nextNum}`;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const sales = await prisma.penjualan.findMany({
      include: {
        customer: { select: { name: true } },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedData = sales.map((sale) => ({
      id: sale.invoiceId,
      dbId: sale.id,
      customer: sale.customer?.name || "Pelanggan Umum",
      date: sale.createdAt ? sale.createdAt.toISOString().split('T')[0] : "-",
      createdAt: sale.createdAt,
      total: sale.totalAmount || 0,
      status: sale.status,
      itemCount: sale.items?.length || 0,
      items: sale.items
    }));

    return NextResponse.json(formattedData, { status: 200 });
  } catch (error) {
    console.error("API_GET_SALES_ERROR:", error);
    return NextResponse.json({ message: "Gagal mengambil data", error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const currentUser = session.user.name || "System";
    const body = await request.json();
    const { customerId, totalAmount, items } = body;

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const dateString = now.toISOString().split('T')[0].replace(/-/g, '');
      const lastSaleToday = await tx.penjualan.findFirst({
        where: { invoiceId: { startsWith: `INV/${dateString}/` } },
        orderBy: { invoiceId: 'desc' }
      });

      let nextNumber = 1;
      if (lastSaleToday) {
        const lastNumber = parseInt(lastSaleToday.invoiceId.split('/').pop());
        nextNumber = lastNumber + 1;
      }
      const newInvoiceId = `INV/${dateString}/${String(nextNumber).padStart(3, '0')}`;

      const sale = await tx.penjualan.create({
        data: {
          invoiceId: newInvoiceId, 
          totalAmount: parseFloat(totalAmount),
          status: 'PENDING',
          customerId,
          items: {
            create: items.map((item) => ({
              productName: item.name,
              quantity: parseFloat(item.quantity),
              unit: item.unit || "Unit",
              price: parseFloat(item.price),
            })),
          },
        },
        include: { items: true }
      });

      for (const item of items) {
        await tx.stock.updateMany({
          where: { name: item.name },
          data: { stock: { decrement: parseFloat(item.quantity) } }
        });

        await tx.history.create({
          data: {
            action: "SALES_PENDING",
            item: item.name,
            category: "Sales",
            type: "OUT",
            quantity: parseFloat(item.quantity),
            unit: item.unit || "Unit",
            user: currentUser,
            notes: `Booking stok untuk Invoice: ${newInvoiceId}`,
            referenceId: sale.id
          }
        });
      }
      return sale;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("API_POST_SALES_ERROR:", error);
    return NextResponse.json({ message: "Gagal simpan transaksi", details: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const currentUser = session.user.name || "System";
    const { id, status, method } = await request.json();

    const result = await prisma.$transaction(async (tx) => {
      const existingSale = await tx.penjualan.findUnique({
        where: { invoiceId: id },
        include: { items: true }
      });

      if (!existingSale) throw new Error("Transaksi tidak ditemukan");

      if (status === "COMPLETED" && existingSale.status === "PENDING") {
        const financeTrxNo = await generateFinanceTrxNo(tx);
        
        await tx.transaction.create({
          data: {
            trxNo: financeTrxNo,
            category: 'Penjualan',
            description: `Penerimaan Dana Invoice ${id}`,
            amount: existingSale.totalAmount,
            type: 'INCOME',
            date: new Date(),
            method: method || "CASH",
            createdBy: currentUser
          }
        });

        await tx.history.create({
          data: {
            action: "FINANCE_IN",
            item: "Dana Penjualan",
            category: "FINANCE",
            type: "MONEY",
            quantity: existingSale.totalAmount,
            unit: "IDR",
            user: currentUser,
            notes: `Invoice ${id} telah lunas/diselesaikan`,
            referenceId: existingSale.id
          }
        });
      }

      if (status === "CANCELLED" && existingSale.status !== "CANCELLED") {
        for (const item of existingSale.items) {
          await tx.stock.updateMany({
            where: { name: item.productName },
            data: { stock: { increment: item.quantity } }
          });
        }
      }

      return await tx.penjualan.update({
        where: { invoiceId: id },
        data: { status: status }
      });
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("API_PATCH_STATUS_ERROR:", error);
    return NextResponse.json({ message: error.message || "Gagal update status" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.penjualan.findUnique({
        where: { invoiceId: id },
        include: { items: true }
      });

      if (!sale) throw new Error("Transaksi tidak ditemukan");

      if (sale.status !== "CANCELLED") {
        for (const item of sale.items) {
          await tx.stock.updateMany({
            where: { name: item.productName },
            data: { stock: { increment: item.quantity } }
          });
        }
      }

      await tx.penjualanItem.deleteMany({ where: { penjualanId: sale.id } });
      await tx.penjualan.delete({ where: { id: sale.id } });

      return { message: "Berhasil dihapus & stok dikembalikan" };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("API_DELETE_SALES_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}