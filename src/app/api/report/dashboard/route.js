import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [
      financeStats,
      salesStats,
      productionSummary,
      criticalStocks,
      staffStats,
      recentLogs,
      totalStockCount,
      totalStaffCount
    ] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['type'],
        _sum: { amount: true }
      }),
      prisma.penjualan.aggregate({
        _sum: { totalAmount: true },
        _count: { id: true }
      }),
      prisma.production.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      prisma.stock.findMany({
        where: { stock: { lt: 10 } },
        select: { name: true, stock: true, unit: true, type: true }
      }),
      prisma.staffs.groupBy({
        by: ['designation'],
        _count: { id: true }
      }),
      prisma.history.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stock.count(),
      prisma.staffs.count()
    ]);

    const income = financeStats.find(s => s.type === "INCOME")?._sum.amount || 0;
    const expense = financeStats.find(s => s.type === "EXPENSE")?._sum.amount || 0;

    return NextResponse.json({
      finance: {
        totalIncome: income,
        totalExpense: expense,
        netBalance: income - expense,
        totalSalesInvoice: salesStats._sum.totalAmount || 0,
        salesCount: salesStats._count.id
      },
      production: productionSummary,
      inventory: {
        criticalItems: criticalStocks,
        totalItems: totalStockCount
      },
      hr: {
        totalStaff: totalStaffCount,
        byDesignation: staffStats
      },
      activities: recentLogs
    }, { status: 200 });

  } catch (error) {
    console.error("REPORT_API_ERROR:", error);
    return NextResponse.json({ 
      message: "Gagal memproses laporan", 
      error: error.message 
    }, { status: 500 });
  }
}