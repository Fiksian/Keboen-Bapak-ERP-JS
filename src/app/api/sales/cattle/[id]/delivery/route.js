// ============================================================
// FILE 1: /app/api/sales/cattle/[id]/delivery/route.js
// POST — Buat delivery tracking untuk sales order
// PATCH — Update status pengiriman (ON_DELIVERY → DELIVERED)
// GET  — Detail delivery satu order
// ============================================================

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

const ALLOWED_WRITE = ['SuperAdmin', 'Admin', 'Supervisor', 'Manager'];

// ── Auto-generate Surat Jalan number ─────────────────────────
const generateSJNo = async (tx) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix  = `SJ/SB/${dateStr}/`;
  const last    = await (tx || prisma).deliveryTracking.findFirst({
    where  : { suratJalanNo: { startsWith: prefix } },
    orderBy: { suratJalanNo: 'desc' },
    select : { suratJalanNo: true },
  });
  const seq = last ? parseInt(last.suratJalanNo.split('/').pop()) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
};

export async function GET(req, { params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const order = await prisma.salesOrder.findFirst({
      where  : { OR: [{ id }, { invoiceNo: id }] },
      select : { id: true },
    });
    if (!order) return NextResponse.json({ message: 'Order tidak ditemukan.' }, { status: 404 });

    const delivery = await prisma.deliveryTracking.findUnique({
      where  : { salesOrderId: order.id },
      include: { salesOrder: { select: { invoiceNo: true, totalEkor: true, customer: { select: { name: true } } } } },
    });

    if (!delivery) return NextResponse.json({ message: 'Belum ada data pengiriman.' }, { status: 404 });
    return NextResponse.json(delivery);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !ALLOWED_WRITE.includes(session.user?.role))
    return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

  try {
    const order = await prisma.salesOrder.findFirst({
      where : { OR: [{ id }, { invoiceNo: id }] },
      select: { id: true, invoiceNo: true, deliveryAddress: true, status: true },
    });
    if (!order) return NextResponse.json({ message: 'Order tidak ditemukan.' }, { status: 404 });

    // Cek sudah ada delivery?
    const existing = await prisma.deliveryTracking.findUnique({ where: { salesOrderId: order.id } });
    if (existing) return NextResponse.json({ message: 'Delivery tracking sudah ada.', delivery: existing }, { status: 409 });

    const {
      driverName, vehicleNo, vehicleCapacity, helperName,
      originAddress, departedAt, estimatedArrival, destAddress, notes,
    } = await req.json();

    const suratJalanNo = await generateSJNo();

    const delivery = await prisma.deliveryTracking.create({
      data: {
        salesOrderId    : order.id,
        suratJalanNo,
        driverName      : driverName?.trim()   || null,
        vehicleNo       : vehicleNo?.trim()     || null,
        vehicleCapacity : vehicleCapacity ? parseInt(vehicleCapacity) : null,
        helperName      : helperName?.trim()    || null,
        originAddress   : originAddress?.trim() || null,
        destAddress     : destAddress?.trim()   || order.deliveryAddress || null,
        departedAt      : departedAt ? new Date(departedAt) : null,
        estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : null,
        status          : departedAt ? 'ON_DELIVERY' : 'PENDING',
        notes           : notes?.trim() || null,
      },
    });

    return NextResponse.json({
      message : `Surat Jalan ${suratJalanNo} berhasil dibuat.`,
      delivery,
    }, { status: 201 });
  } catch (err) {
    console.error('DELIVERY_POST:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !['SuperAdmin','Admin','Supervisor','Manager','Staff'].includes(session.user?.role))
    return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

  try {
    const order = await prisma.salesOrder.findFirst({
      where : { OR: [{ id }, { invoiceNo: id }] },
      select: { id: true },
    });
    if (!order) return NextResponse.json({ message: 'Order tidak ditemukan.' }, { status: 404 });

    const { status, arrivedAt, receivedBy, notes, driverName, vehicleNo, departedAt } = await req.json();

    const VALID = ['PENDING', 'ON_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (status && !VALID.includes(status))
      return NextResponse.json({ message: `Status tidak valid. Pilihan: ${VALID.join(', ')}` }, { status: 400 });

    const data = {};
    if (status)     data.status     = status;
    if (receivedBy) data.receivedBy = receivedBy;
    if (notes)      data.notes      = notes;
    if (driverName) data.driverName = driverName;
    if (vehicleNo)  data.vehicleNo  = vehicleNo;
    if (departedAt) data.departedAt = new Date(departedAt);

    // Auto-set arrivedAt jika DELIVERED
    if (status === 'DELIVERED') {
      data.arrivedAt = arrivedAt ? new Date(arrivedAt) : new Date();
    }

    const updated = await prisma.deliveryTracking.update({
      where: { salesOrderId: order.id },
      data,
    });

    return NextResponse.json({ message: `Status pengiriman diperbarui: ${status}.`, delivery: updated });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}


// ============================================================
// FILE 2: /app/api/sales/cattle/price-history/route.js
// GET — Riwayat harga jual rata-rata per kg per bulan
//       Untuk grafik tren harga di tab "Riwayat Harga"
// ============================================================

export async function GET_PRICE_HISTORY(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const months    = parseInt(searchParams.get('months') || '6');  // default 6 bulan terakhir
    const warehouse = searchParams.get('warehouseId');

    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const where = {
      status   : 'COMPLETED',
      createdAt: { gte: since },
    };
    if (warehouse) where.warehouseId = warehouse;

    // Ambil semua completed orders dalam rentang waktu
    const orders = await prisma.salesOrder.findMany({
      where,
      select: {
        invoiceNo    : true,
        pricePerKg   : true,
        totalWeightKg: true,
        totalAmount  : true,
        totalEkor    : true,
        createdAt    : true,
        items: {
          select: {
            pricePerKg   : true,
            finalWeightKg: true,
            hppPerEkor   : true,
            marginPerEkor: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by month-year
    const monthMap = new Map();

    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 7); // "2026-01"
      if (!monthMap.has(key)) {
        monthMap.set(key, {
          month       : key,
          totalWeight : 0,
          totalRevenue: 0,
          totalEkor   : 0,
          totalHpp    : 0,
          count       : 0,
          prices      : [],
        });
      }
      const m = monthMap.get(key);
      m.totalWeight  += order.totalWeightKg;
      m.totalRevenue += order.totalAmount;
      m.totalEkor    += order.totalEkor;
      m.count        += 1;

      for (const item of order.items) {
        m.totalHpp += item.hppPerEkor || 0;
        if (item.pricePerKg > 0) m.prices.push(item.pricePerKg);
      }
    }

    // Build hasil dengan avg price per kg & margin
    const history = Array.from(monthMap.values()).map((m) => {
      const avgPrice    = m.totalWeight > 0 ? parseFloat((m.totalRevenue / m.totalWeight).toFixed(0)) : 0;
      const avgHpp      = m.totalEkor   > 0 ? parseFloat((m.totalHpp / m.totalEkor).toFixed(0)) : 0;
      const avgMargin   = avgPrice - (avgHpp / (m.totalWeight / m.totalEkor || 1));
      const minPrice    = m.prices.length > 0 ? Math.min(...m.prices) : 0;
      const maxPrice    = m.prices.length > 0 ? Math.max(...m.prices) : 0;

      return {
        month       : m.month,
        label       : new Date(m.month + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        avgPricePerKg: avgPrice,
        minPricePerKg: parseFloat(minPrice.toFixed(0)),
        maxPricePerKg: parseFloat(maxPrice.toFixed(0)),
        totalRevenue  : parseFloat(m.totalRevenue.toFixed(0)),
        totalEkor     : m.totalEkor,
        totalWeightKg : parseFloat(m.totalWeight.toFixed(1)),
        transactionCount: m.count,
      };
    });

    // Latest & trend (perbandingan bulan terakhir vs sebelumnya)
    const last    = history[history.length - 1];
    const prev    = history[history.length - 2];
    const trend   = last && prev && prev.avgPricePerKg > 0
      ? parseFloat((((last.avgPricePerKg - prev.avgPricePerKg) / prev.avgPricePerKg) * 100).toFixed(1))
      : null;

    return NextResponse.json({
      history,
      summary: {
        latestAvgPrice: last?.avgPricePerKg ?? null,
        trend,              // % change vs bulan lalu
        trendLabel : trend != null ? (trend >= 0 ? `+${trend}%` : `${trend}%`) : '-',
        totalOrders: orders.length,
        periodLabel: `${months} bulan terakhir`,
      },
    });
  } catch (err) {
    console.error('PRICE_HISTORY_GET:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
