import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where = {};
    if (type) where.type = type;
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" }
    });

    const stats = await prisma.transaction.groupBy({
      by: ['type'],
      _sum: { amount: true }
    });

    const income = stats.find(s => s.type === "INCOME")?._sum.amount || 0;
    const expense = stats.find(s => s.type === "EXPENSE")?._sum.amount || 0;

    return NextResponse.json({
      transactions,
      summary: {
        totalBalance: income - expense,
        totalIncome: income,
        totalExpense: expense
      }
    });
  } catch (error) {
    console.error("FINANCE_GET_ERROR:", error);
    return NextResponse.json({ message: "Gagal mengambil data keuangan" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { category, description, amount, type, date, method } = body;

    if (!category || amount === undefined || !type) {
      return NextResponse.json({ message: "Data tidak lengkap" }, { status: 400 });
    }

    const now = new Date();
    const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, "");
    
    const lastTrx = await prisma.transaction.findFirst({
      where: { trxNo: { startsWith: `TRX-${datePrefix}` } },
      orderBy: { trxNo: 'desc' }
    });

    let nextNum = "001";
    if (lastTrx) {
      const lastPart = lastTrx.trxNo.split("-")[2];
      nextNum = String(parseInt(lastPart) + 1).padStart(3, "0");
    }
    const trxNo = `TRX-${datePrefix}-${nextNum}`;

    const result = await prisma.$transaction(async (tx) => {
      const trx = await tx.transaction.create({
        data: {
          trxNo,
          category,
          description,
          amount: parseFloat(amount),
          type,
          date: date ? new Date(date) : new Date(),
          method: method || "CASH",
          createdBy: session.user.name || "System"
        }
      });

      await tx.history.create({
        data: {
          action: type === "INCOME" ? "FINANCE_IN" : "FINANCE_OUT",
          item: category,
          category: "FINANCE",
          type: "MONEY",
          quantity: parseFloat(amount),
          unit: "IDR",
          user: session.user.name || "System",
          notes: `${trxNo}: ${description || category}`
        }
      });

      return trx;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("FINANCE_POST_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID transaksi wajib dilampirkan" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const trx = await tx.transaction.findUnique({
        where: { id: id }
      });

      if (!trx) throw new Error("Transaksi tidak ditemukan");

      await tx.history.create({
        data: {
          action: "FINANCE_DELETE",
          item: trx.category,
          category: "FINANCE",
          type: "MONEY",
          quantity: parseFloat(trx.amount) || 0,
          unit: "IDR",
          user: session.user.name || "System",
          notes: `MENGHAPUS TRX: ${trx.trxNo} | Deskripsi Awal: ${trx.description || '-'}`
        }
      });

      await tx.transaction.delete({
        where: { id: id }
      });

      return { message: "Transaksi berhasil dihapus dan dicatat di log history" };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("FINANCE_DELETE_ERROR:", error);
    return NextResponse.json({ message: error.message || "Gagal menghapus transaksi" }, { status: 500 });
  }
}