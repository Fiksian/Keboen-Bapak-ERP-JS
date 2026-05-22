// /app/api/sales/cattle/route.js
// GET  — List semua SalesOrder sapi, filter status / date / customer
// POST — Buat SalesOrder baru, generate invoiceNo otomatis
// ============================================================

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

const ALLOWED = ['SuperAdmin', 'Admin', 'Supervisor', 'Manager', 'Sales', 'Staff'];

// ── Auto-generate invoice number ──────────────────────────────
const generateInvoiceNo = async (tx) => {
  const now    = new Date();
  const year   = now.getFullYear();
  const prefix = `INV/SB/${year}/`;
  const last   = await (tx || prisma).salesOrder.findFirst({
    where  : { invoiceNo: { startsWith: prefix } },
    orderBy: { invoiceNo: 'desc' },
    select : { invoiceNo: true },
  });
  const seq = last ? parseInt(last.invoiceNo.split('/').pop()) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
};

// ─── GET ────────────────────────────────────────────────────
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status      = searchParams.get('status');
    const customerId  = searchParams.get('customerId');
    const warehouseId = searchParams.get('warehouseId');
    const from        = searchParams.get('from');
    const to          = searchParams.get('to');
    const search      = searchParams.get('search');
    const take        = Math.min(parseInt(searchParams.get('take') || '50'), 200);

    const where = {};
    if (status)      where.status      = status;
    if (customerId)  where.customerId  = customerId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to)   where.createdAt.lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }
    if (search) {
      where.OR = [
        { invoiceNo : { contains: search, mode: 'insensitive' } },
        { customer  : { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        customer : { select: { id: true, name: true, phone: true } },
        warehouse: { select: { id: true, name: true } },
        delivery : { select: { id: true, status: true, suratJalanNo: true, vehicleNo: true } },
        items    : { select: { id: true, rfidNo: true, finalWeightKg: true, pricePerKg: true, subTotal: true } },
        _count   : { select: { items: true } },
      },
    });

    // Agregat summary
    const totalRevenue   = orders.filter((o) => o.status === 'COMPLETED').reduce((s, o) => s + o.totalAmount, 0);
    const totalPending   = orders.filter((o) => !['COMPLETED','CANCELLED'].includes(o.status)).length;

    return NextResponse.json({ orders, summary: { totalRevenue, totalPending, count: orders.length } });
  } catch (err) {
    console.error('CATTLE_SALES_GET:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── POST ───────────────────────────────────────────────────
// Body:
// {
//   customerId, warehouseId, paymentMethod, dueDate, notes, deliveryAddress,
//   discount, discountPct, taxPct, shippingCost,
//   items: [
//     { rfidNo, cattleId?, finalWeightKg, pricePerKg, hppPerEkor?, breed?, notes? }
//   ]
// }
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED.includes(session.user?.role))
      return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

    const body = await req.json();
    const {
      customerId, warehouseId, paymentMethod, dueDate, notes, deliveryAddress,
      discount = 0, discountPct = 0, taxPct = 0, shippingCost = 0,
      items = [],
    } = body;

    if (!items.length)
      return NextResponse.json({ message: 'Minimal 1 sapi harus dimasukkan.' }, { status: 400 });

    // Validasi items
    for (const it of items) {
      if (!it.rfidNo?.trim())
        return NextResponse.json({ message: 'rfidNo wajib untuk setiap item.' }, { status: 400 });
      if (!parseFloat(it.finalWeightKg) || parseFloat(it.finalWeightKg) <= 0)
        return NextResponse.json({ message: `Bobot timbang untuk ${it.rfidNo} harus > 0.` }, { status: 400 });
      if (!parseFloat(it.pricePerKg) || parseFloat(it.pricePerKg) <= 0)
        return NextResponse.json({ message: `Harga per kg untuk ${it.rfidNo} harus > 0.` }, { status: 400 });
    }

    const createdBy = session.user.name || session.user.email;

    // Kalkulasi totals
    const itemsData = items.map((it) => {
      const weight   = parseFloat(it.finalWeightKg);
      const price    = parseFloat(it.pricePerKg);
      const hpp      = parseFloat(it.hppPerEkor || 0);
      const subTotal = parseFloat((weight * price).toFixed(2));
      return {
        rfidNo       : it.rfidNo.trim(),
        cattleId     : it.cattleId || null,
        finalWeightKg: weight,
        pricePerKg   : price,
        hppPerEkor   : hpp,
        subTotal,
        marginPerEkor: parseFloat((subTotal - hpp).toFixed(2)),
        breed        : it.breed?.trim() || null,
        notes        : it.notes?.trim() || null,
      };
    });

    const subtotal      = parseFloat(itemsData.reduce((s, i) => s + i.subTotal, 0).toFixed(2));
    const discAmt       = discountPct > 0
      ? parseFloat((subtotal * parseFloat(discountPct) / 100).toFixed(2))
      : parseFloat(parseFloat(discount).toFixed(2));
    const afterDiscount = subtotal - discAmt;
    const taxAmt        = taxPct > 0 ? parseFloat((afterDiscount * parseFloat(taxPct) / 100).toFixed(2)) : 0;
    const totalAmount   = parseFloat((afterDiscount + taxAmt + parseFloat(shippingCost)).toFixed(2));
    const totalEkor     = itemsData.length;
    const totalWeight   = parseFloat(itemsData.reduce((s, i) => s + i.finalWeightKg, 0).toFixed(2));
    const avgPricePerKg = totalWeight > 0 ? parseFloat((subtotal / totalWeight).toFixed(2)) : 0;

    const order = await prisma.$transaction(async (tx) => {
      const invoiceNo = await generateInvoiceNo(tx);

      // Verifikasi & enrich dengan HPP dari Cattle jika belum diisi
      const enrichedItems = await Promise.all(itemsData.map(async (it) => {
        if (!it.cattleId && !it.hppPerEkor) {
          const cattle = await tx.cattle.findFirst({
            where : { rfidNo: it.rfidNo },
            select: { id: true, hppPerEkor: true },
          });
          if (cattle) {
            it.cattleId     = cattle.id;
            it.hppPerEkor   = cattle.hppPerEkor || 0;
            it.marginPerEkor = parseFloat((it.subTotal - it.hppPerEkor).toFixed(2));
          }
        }
        return it;
      }));

      return tx.salesOrder.create({
        data: {
          invoiceNo,
          customerId   : customerId || null,
          warehouseId  : warehouseId || null,
          totalEkor,
          totalWeightKg: totalWeight,
          pricePerKg   : avgPricePerKg,
          subtotal,
          discount     : discAmt,
          discountPct  : parseFloat(discountPct),
          taxPct       : parseFloat(taxPct),
          taxAmount    : taxAmt,
          shippingCost : parseFloat(shippingCost),
          totalAmount,
          paymentMethod: paymentMethod || 'TRANSFER',
          dueDate      : dueDate ? new Date(dueDate) : null,
          notes        : notes?.trim() || null,
          deliveryAddress: deliveryAddress?.trim() || null,
          createdBy,
          items: { create: enrichedItems },
        },
        include: {
          customer: { select: { name: true } },
          items   : true,
        },
      });
    });

    return NextResponse.json({
      message : `Invoice ${order.invoiceNo} berhasil dibuat.`,
      invoiceNo: order.invoiceNo,
      order,
    }, { status: 201 });

  } catch (err) {
    console.error('CATTLE_SALES_POST:', err);
    if (err.code === 'P2002')
      return NextResponse.json({ message: 'Invoice number sudah digunakan.' }, { status: 409 });
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
