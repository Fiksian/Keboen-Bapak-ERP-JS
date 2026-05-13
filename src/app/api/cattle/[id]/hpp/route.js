// /app/api/cattle/[id]/hpp/route.js
// POST — Tambah komponen biaya HPP, auto-recalculate total
// GET  — Breakdown HPP lengkap + kalkulasi per-kg
// DELETE — Hapus satu komponen HPP (query: ?componentId=xxx)
// ============================================================

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

const ALLOWED       = ['SuperAdmin', 'Admin', 'Supervisor'];
const VALID_CATS    = ['HARGA_BELI','LANDED_COST','KARANTINA','PAKAN','TENAGA_KERJA','UTILITAS','OVERHEAD','LAINNYA'];

// ── Helper: hitung amount per-head dari satu komponen ─────────
const toPerHead = (c) =>
  c.isPerHead ? c.amount : (c.headCount && c.headCount > 0 ? c.amount / c.headCount : c.amount);

// ── Helper: rekalkukasi & simpan hppPerEkor ke Cattle ─────────
async function recalcHPP(cattleId, tx = prisma) {
  const [cattle, components] = await Promise.all([
    tx.cattle.findUnique({
      where : { id: cattleId },
      select: { hargaBeliTotal: true, weightTerima: true },
    }),
    tx.cattleHPPComponent.findMany({ where: { cattleId } }),
  ]);

  const base        = parseFloat(cattle?.hargaBeliTotal ?? 0);
  const compTotal   = components.reduce((s, c) => s + toPerHead(c), 0);
  const grandTotal  = base + compTotal;
  const hppPerKg    = cattle?.weightTerima ? grandTotal / cattle.weightTerima : null;

  await tx.cattle.update({
    where: { id: cattleId },
    data : { hppPerEkor: grandTotal, ...(hppPerKg != null ? { hppPerKg } : {}) },
  });

  return { grandTotal, hppPerKg, base, compTotal };
}

// ─── POST ────────────────────────────────────────────────────
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !ALLOWED.includes(session.user?.role))
    return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

  try {
    // ✅ AWALI params
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });
    }

    const { category, description, amount, isPerHead, headCount, note } = await req.json();

    if (!VALID_CATS.includes(category))
      return NextResponse.json({ message: `Kategori tidak valid. Pilihan: ${VALID_CATS.join(', ')}` }, { status: 400 });
    if (!description?.trim())
      return NextResponse.json({ message: 'Keterangan biaya wajib diisi.' }, { status: 400 });

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0)
      return NextResponse.json({ message: 'Jumlah biaya tidak valid.' }, { status: 400 });

    const comp = await prisma.cattleHPPComponent.create({
      data: {
        cattleId   : id,
        category,
        description: description.trim(),
        amount     : parsedAmount,
        isPerHead  : Boolean(isPerHead),
        headCount  : headCount ? parseInt(headCount) : null,
        recordedBy : session.user.name || session.user.email,
        note       : note?.trim() || null,
      },
    });

    const { grandTotal, hppPerKg } = await recalcHPP(id);

    return NextResponse.json({
      message    : 'Komponen biaya berhasil ditambahkan.',
      component  : comp,
      totalHPP   : grandTotal,
      hppPerKg,
    });
  } catch (err) {
    console.error('CATTLE_HPP_POST:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── GET ─────────────────────────────────────────────────────
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    // ✅ AWALI params
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });
    }

    const cattle = await prisma.cattle.findUnique({
      where  : { id: id },
      select : {
        weightBeli    : true,
        weightTerima  : true,
        weightGrading : true,
        hargaBeliPerKg: true,
        hargaBeliTotal: true,
        susutPct      : true,
        hppPerEkor    : true,
        hppPerKg      : true,
        hppComponents : { orderBy: { date: 'asc' } },
      },
    });
    if (!cattle) return NextResponse.json({ message: 'Tidak ditemukan.' }, { status: 404 });

    const components = cattle.hppComponents.map((c) => ({
      ...c,
      amountPerHead: toPerHead(c),
    }));

    // Group by category
    const grouped = {};
    for (const c of components) {
      if (!grouped[c.category]) grouped[c.category] = { total: 0, items: [] };
      grouped[c.category].total += c.amountPerHead;
      grouped[c.category].items.push(c);
    }

    const base       = parseFloat(cattle.hargaBeliTotal ?? 0);
    const compTotal  = components.reduce((s, c) => s + c.amountPerHead, 0);
    const grandTotal = base + compTotal;
    const hppPerKg   = cattle.weightTerima ? grandTotal / cattle.weightTerima : null;

    // Analisis susut cost (kerugian berat hilang selama perjalanan)
    const susutCostAnalysis = cattle.weightBeli && cattle.weightTerima && cattle.hargaBeliPerKg
      ? {
          susutKg   : cattle.weightBeli - cattle.weightTerima,
          susutPct  : cattle.susutPct,
          costLoss  : (cattle.weightBeli - cattle.weightTerima) * cattle.hargaBeliPerKg,
          // HPP efektif: bayar bobot beli, terima bobot terima → naikan HPP/kg
          hppEffective: cattle.weightTerima
            ? grandTotal / cattle.weightTerima
            : null,
        }
      : null;

    return NextResponse.json({
      ...cattle,
      components,
      grouped,
      summary: {
        baseHargaBeli  : base,
        totalComponents: compTotal,
        grandTotal,
        hppPerKg,
      },
      susutCostAnalysis,
    });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── DELETE ?componentId=xxx ─────────────────────────────────
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !ALLOWED.includes(session.user?.role))
    return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

  try {
    // ✅ AWALI params
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const componentId = searchParams.get('componentId');

    if (!componentId)
      return NextResponse.json({ message: 'componentId diperlukan.' }, { status: 400 });

    // Verifikasi komponen milik sapi ini
    const comp = await prisma.cattleHPPComponent.findFirst({
      where: { id: componentId, cattleId: id },
    });
    if (!comp) return NextResponse.json({ message: 'Komponen tidak ditemukan.' }, { status: 404 });

    await prisma.cattleHPPComponent.delete({ where: { id: componentId } });

    const { grandTotal, hppPerKg } = await recalcHPP(id);

    return NextResponse.json({
      message : 'Komponen dihapus.',
      totalHPP: grandTotal,
      hppPerKg,
    });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}