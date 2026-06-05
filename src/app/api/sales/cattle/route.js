// /app/api/sales/cattle/route.js — v2 (ADG + Shipment Performance)
//
// GET  — List semua SalesOrder sapi + filter
// POST — Buat SalesOrder baru dengan:
//         • Kalkulasi ADG otomatis per ekor
//         • Validasi stok kandang
//         • Snapshot shipment performance (gender breakdown, avg weight, remaining stock)
// ============================================================

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

const ALLOWED = ['SuperAdmin', 'Admin', 'Supervisor', 'Manager', 'Sales', 'Staff'];

// ── Nilai ADG default per GenderType (kg/hari) jika breed tidak punya defaultADG ──
const ADG_DEFAULTS = {
  STEER  : 1.2,  // Jantan kastrasi — konversi pakan terbaik
  HEIFER : 0.9,  // Betina muda — pertumbuhan lebih lambat
  BULL   : 1.0,  // Jantan utuh
  UNKNOWN: 1.0,  // Fallback
};

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

// ── Kalkulasi estimasi bobot ADG ──────────────────────────────
// Rumus: W_est = W_last + (hari_sejak_timbang × ADG)
// Bila plannedSaleDate tidak diisi, gunakan today.
const calcADGWeight = ({
  lastWeight,       // Float — bobot timbang terakhir (kg)
  lastWeightDate,   // Date | null — tanggal timbang terakhir
  arrivalDate,      // Date | null — fallback jika lastWeightDate null
  createdAt,        // Date — fallback akhir
  plannedSaleDate,  // Date | string | null
  genderType,       // GenderType string
  breedADG,         // Float | null — ADG dari CattleBreed.defaultADG
}) => {
  const adg = breedADG ?? ADG_DEFAULTS[genderType] ?? ADG_DEFAULTS.UNKNOWN;

  const baseDate  = lastWeightDate ?? arrivalDate ?? createdAt;
  const saleDate  = plannedSaleDate ? new Date(plannedSaleDate) : new Date();
  const msPerDay  = 1000 * 60 * 60 * 24;
  const days      = Math.max(0, Math.floor((saleDate - new Date(baseDate)) / msPerDay));

  const baseWeight = parseFloat(lastWeight ?? 0);
  const estimate   = parseFloat((baseWeight + days * adg).toFixed(1));

  return { estimate, days, adg, baseWeight };
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
        items    : {
          select: {
            id           : true,
            rfidNo       : true,
            finalWeightKg: true,
            pricePerKg   : true,
            subTotal     : true,
            breed        : true,
            genderType   : true,
            adgEstWeight : true,
          },
        },
        _count: { select: { items: true } },
      },
    });

    const totalRevenue = orders.filter((o) => o.status === 'COMPLETED').reduce((s, o) => s + o.totalAmount, 0);
    const totalPending = orders.filter((o) => !['COMPLETED','CANCELLED'].includes(o.status)).length;

    return NextResponse.json({ orders, summary: { totalRevenue, totalPending, count: orders.length } });
  } catch (err) {
    console.error('CATTLE_SALES_GET:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── GET /adg-estimate — Hitung estimasi bobot ADG per RFID ─
// Query params: rfidNo (required), plannedSaleDate (optional)
// Dipakai oleh frontend saat user memilih sapi di form penjualan
export async function GET_ADG(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const rfidNo          = searchParams.get('rfidNo');
    const plannedSaleDate = searchParams.get('date');   // ISO string

    if (!rfidNo) return NextResponse.json({ message: 'rfidNo wajib.' }, { status: 400 });

    const cattle = await prisma.cattle.findFirst({
      where  : { rfidNo },
      include: { purchasing: { select: { items: { select: { breed: { select: { defaultADG: true } } } } } } },
    });
    if (!cattle) return NextResponse.json({ message: 'Sapi tidak ditemukan.' }, { status: 404 });

    // Ambil defaultADG dari breed pertama di PO (atau null)
    const breedADG = cattle.purchasing?.items?.[0]?.breed?.defaultADG ?? null;

    const result = calcADGWeight({
      lastWeight     : cattle.weight ?? cattle.weightTerima,
      lastWeightDate : cattle.lastWeightDate,
      arrivalDate    : cattle.arrivalDate,
      createdAt      : cattle.createdAt,
      plannedSaleDate,
      genderType     : cattle.genderType ?? 'UNKNOWN',
      breedADG,
    });

    return NextResponse.json({
      rfidNo,
      genderType  : cattle.genderType,
      breed       : cattle.breed,
      hppPerEkor  : cattle.hppPerEkor ?? 0,
      lastWeight  : cattle.weight,
      lastWeightDate: cattle.lastWeightDate,
      ...result,
    });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── POST ───────────────────────────────────────────────────
// Body:
// {
//   customerId, warehouseId, paymentMethod, dueDate, notes, deliveryAddress,
//   discount, discountPct, taxPct, shippingCost, plannedSaleDate?,
//   items: [{
//     rfidNo, cattleId?, finalWeightKg, pricePerKg,
//     hppPerEkor?, breed?, genderType?, adgEstWeight?, notes?
//   }]
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
      plannedSaleDate = null,
      items = [],
    } = body;

    if (!items.length)
      return NextResponse.json({ message: 'Minimal 1 sapi harus dimasukkan.' }, { status: 400 });

    // ── Validasi items ─────────────────────────────────────────
    for (const it of items) {
      if (!it.rfidNo?.trim())
        return NextResponse.json({ message: 'rfidNo wajib untuk setiap item.' }, { status: 400 });
      if (!parseFloat(it.finalWeightKg) || parseFloat(it.finalWeightKg) <= 0)
        return NextResponse.json({ message: `Bobot timbang untuk ${it.rfidNo} harus > 0.` }, { status: 400 });
      if (!parseFloat(it.pricePerKg) || parseFloat(it.pricePerKg) <= 0)
        return NextResponse.json({ message: `Harga per kg untuk ${it.rfidNo} harus > 0.` }, { status: 400 });
    }

    const createdBy = session.user.name || session.user.email;

    // ── Enrich setiap item: ambil data Cattle dari DB ─────────
    const enrichedItems = await Promise.all(items.map(async (it) => {
      const cattle = it.cattleId
        ? await prisma.cattle.findUnique({ where: { id: it.cattleId } })
        : await prisma.cattle.findFirst({ where: { rfidNo: it.rfidNo.trim() } });

      const weight   = parseFloat(it.finalWeightKg);
      const price    = parseFloat(it.pricePerKg);
      const hpp      = parseFloat(it.hppPerEkor || cattle?.hppPerEkor || 0);
      const subTotal = parseFloat((weight * price).toFixed(2));

      // ADG estimate — simpan sebagai audit trail
      let adgEstWeight = parseFloat(it.adgEstWeight || 0);
      if (!adgEstWeight && cattle) {
        const { estimate } = calcADGWeight({
          lastWeight     : cattle.weight,
          lastWeightDate : cattle.lastWeightDate,
          arrivalDate    : cattle.arrivalDate,
          createdAt      : cattle.createdAt,
          plannedSaleDate,
          genderType     : it.genderType || cattle.genderType || 'UNKNOWN',
          breedADG       : null,
        });
        adgEstWeight = estimate;
      }

      return {
        rfidNo       : it.rfidNo.trim(),
        cattleId     : cattle?.id || it.cattleId || null,
        finalWeightKg: weight,
        pricePerKg   : price,
        hppPerEkor   : hpp,
        subTotal,
        marginPerEkor: parseFloat((subTotal - hpp).toFixed(2)),
        breed        : it.breed?.trim() || cattle?.breed || null,
        genderType   : it.genderType   || cattle?.genderType || 'UNKNOWN',
        adgEstWeight,
        notes        : it.notes?.trim() || null,
      };
    }));

    // ── Kalkulasi totals ───────────────────────────────────────
    const subtotal      = parseFloat(enrichedItems.reduce((s, i) => s + i.subTotal, 0).toFixed(2));
    const discAmt       = discountPct > 0
      ? parseFloat((subtotal * parseFloat(discountPct) / 100).toFixed(2))
      : parseFloat(parseFloat(discount).toFixed(2));
    const afterDiscount = subtotal - discAmt;
    const taxAmt        = taxPct > 0 ? parseFloat((afterDiscount * parseFloat(taxPct) / 100).toFixed(2)) : 0;
    const totalAmount   = parseFloat((afterDiscount + taxAmt + parseFloat(shippingCost)).toFixed(2));
    const totalEkor     = enrichedItems.length;
    const totalWeight   = parseFloat(enrichedItems.reduce((s, i) => s + i.finalWeightKg, 0).toFixed(2));
    const avgPricePerKg = totalWeight > 0 ? parseFloat((subtotal / totalWeight).toFixed(2)) : 0;

    // ── Shipment performance snapshot ──────────────────────────
    const avgWeightShipped = totalEkor > 0
      ? parseFloat((totalWeight / totalEkor).toFixed(2))
      : 0;
    const countSteer  = enrichedItems.filter((i) => i.genderType === 'STEER').length;
    const countHeifer = enrichedItems.filter((i) => i.genderType === 'HEIFER').length;
    const countBull   = enrichedItems.filter((i) => i.genderType === 'BULL').length;

    // ── Hitung remaining stock di warehouse ────────────────────
    let remainingStock = null;
    if (warehouseId) {
      const inKandangCount = await prisma.cattle.count({
        where: {
          warehouseId,
          status: 'IN_KANDANG',
          // Kecualikan sapi yang ada di order ini
          rfidNo: { notIn: enrichedItems.map((i) => i.rfidNo) },
        },
      });
      remainingStock = inKandangCount;
    }

    // ── Buat SalesOrder dalam transaction ─────────────────────
    const order = await prisma.$transaction(async (tx) => {
      const invoiceNo = await generateInvoiceNo(tx);

      return tx.salesOrder.create({
        data: {
          invoiceNo,
          customerId      : customerId || null,
          warehouseId     : warehouseId || null,
          totalEkor,
          totalWeightKg   : totalWeight,
          pricePerKg      : avgPricePerKg,
          subtotal,
          discount        : discAmt,
          discountPct     : parseFloat(discountPct),
          taxPct          : parseFloat(taxPct),
          taxAmount       : taxAmt,
          shippingCost    : parseFloat(shippingCost),
          totalAmount,
          paymentMethod   : paymentMethod || 'TRANSFER',
          dueDate         : dueDate ? new Date(dueDate) : null,
          notes           : notes?.trim() || null,
          deliveryAddress : deliveryAddress?.trim() || null,
          createdBy,
          // ── Shipment performance ──
          avgWeightShipped,
          countSteer,
          countHeifer,
          countBull,
          remainingStock,
          items: { create: enrichedItems },
        },
        include: {
          customer: { select: { name: true } },
          items   : true,
        },
      });
    });

    // ── Lock Cattle → PENDING_SALE ─────────────────────────────
    const lockPromises = enrichedItems.map(async (it) => {
      try {
        const cid = it.cattleId
          || (await prisma.cattle.findFirst({ where: { rfidNo: it.rfidNo }, select: { id: true } }))?.id;
        if (!cid) return;
        await prisma.cattle.updateMany({
          where: { id: cid, status: 'IN_KANDANG' },
          data : { status: 'PENDING_SALE', weightPanen: it.finalWeightKg, updatedAt: new Date() },
        });
      } catch (e) { console.error('CATTLE_LOCK_ERR:', it.rfidNo, e.message); }
    });
    await Promise.allSettled(lockPromises);

    return NextResponse.json({
      message      : `Invoice ${order.invoiceNo} berhasil dibuat.`,
      invoiceNo    : order.invoiceNo,
      order,
      shipmentInfo : { avgWeightShipped, countSteer, countHeifer, countBull, remainingStock },
    }, { status: 201 });

  } catch (err) {
    console.error('CATTLE_SALES_POST:', err);
    if (err.code === 'P2002')
      return NextResponse.json({ message: 'Invoice number sudah digunakan.' }, { status: 409 });
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── GET /api/sales/cattle/adg-estimate ─────────────────────
// Endpoint terpisah — dipanggil frontend saat user memilih sapi
// Route file: /app/api/sales/cattle/adg-estimate/route.js
//
// import { GET_ADG } from '../route';
// export { GET_ADG as GET };
//
// Atau buat file sendiri dengan isi:
//
// export async function GET(req) {
//   const { searchParams } = new URL(req.url);
//   const rfidNo = searchParams.get('rfidNo');
//   const date   = searchParams.get('date');
//   // ... logika calcADGWeight seperti di atas ...
// }
