import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "Daily";

    let startDate;
    const now = new Date();

    switch (range) {
      case "Weekly":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case "Monthly":
        startDate = startOfMonth(now);
        break;
      default:
        startDate = startOfDay(now);
    }

    const dateFilter = { gte: startDate };

    const [
      transactions,
      purchases,
      stocks,
      productions,
      penjualan,
      staffList,
      histories,
    ] = await Promise.all([
      prisma.transaction.findMany({ 
        where: { date: dateFilter }, 
        orderBy: { date: 'desc' } 
      }),
      prisma.purchasing.findMany({ 
        where: { createdAt: dateFilter },
        include: { receipts: true },
        orderBy: { createdAt: 'desc' } 
      }),
      prisma.stock.findMany({ 
        orderBy: { name: 'asc' } 
      }),
      prisma.production.findMany({ 
        where: { createdAt: dateFilter },
        include: { components: true },
        orderBy: { createdAt: 'desc' } 
      }),
      prisma.penjualan.findMany({ 
        where: { createdAt: dateFilter },
        include: { customer: true, items: true },
        orderBy: { createdAt: 'desc' } 
      }),
      prisma.staffs.findMany({ 
        orderBy: { designation: 'asc' } 
      }),
      prisma.history.findMany({ 
        where: { createdAt: dateFilter },
        take: 100,
        orderBy: { createdAt: 'desc' },
      })
    ]);

    const income = transactions
      .filter(t => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expense = transactions
      .filter(t => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSales = penjualan.reduce((sum, s) => sum + s.totalAmount, 0);

    const prodStats = productions.reduce((acc, curr) => {
      if (curr.status) {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
      }
      return acc;
    }, {});

    const productionSummary = Object.keys(prodStats).map(status => ({
      status: status,
      count: prodStats[status]
    }));

    return NextResponse.json({
      finance: {
        totalIncome: income,
        totalExpense: expense,
        netBalance: income - expense,
        totalSalesInvoice: totalSales,
        salesCount: penjualan.length
      },
      production: productionSummary, 
      inventory: {
        criticalItems: stocks.filter(s => s.stock < 10),
        totalItems: stocks.length
      },
      hr: {
        totalStaff: staffList.length,
      },
      activities: histories.slice(0, 20),

      raw: {
        transactions: transactions.map(({ id, referenceId, createdAt, updatedAt, ...rest }) => ({
          ...rest,
          tanggal: new Date(rest.date || createdAt).toLocaleString('id-ID')
        })),
        purchases: purchases.map(({ id, updatedAt, receipts, ...rest }) => ({
          ...rest,
          totalReceived: receipts?.reduce((sum, r) => sum + r.receivedQty, 0) || 0,
          receiptStatus: rest.isReceived ? "SELESAI" : "PENDING"
        })),
        stocks: stocks.map(({ id, lastPurchasedId, updatedAt, ...rest }) => rest),
        productions: productions.map(({ id, updatedAt, components, ...rest }) => ({
          ...rest,
          componentCount: components?.length || 0
        })),
        penjualan: penjualan.map(({ id, customerId, updatedAt, customer, items, ...rest }) => ({
          ...rest,
          customerName: customer?.name || "Umum",
          totalItems: items?.length || 0
        })),
        staffList: staffList.map(({ id, User, updatedAt, ...rest }) => rest),
        histories: histories.map(({ id, ...rest }) => rest)
      },

      config: {
        range,
        startDate: startDate.toISOString(),
        entityName: "Keboen Bapak Management"
      }
    }, { status: 200 });

  } catch (error) {
    console.error("REPORT_API_ERROR:", error);
    return NextResponse.json({ 
      message: "Gagal memproses laporan", 
      error: error.message 
    }, { status: 500 });
  }
}