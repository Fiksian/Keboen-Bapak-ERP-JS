// /app/api/cattle/[id]/weight/route.js
// POST — Tambah record bobot (BELI / TERIMA / GRADING / PANEN)
//         Auto-hitung susut & update shortcut field di Cattle
// GET  — List semua weight records sapi ini
// ============================================================

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

const ALLOWED = ['SuperAdmin', 'Admin', 'Supervisor', 'Staff'];
const VALID_TYPES = ['BELI', 'TERIMA', 'GRADING', 'PANEN'];

// Field shortcut di model Cattle untuk tiap tipe bobot
const FIELD_MAP = {
  BELI   : 'weightBeli',
  TERIMA : 'weightTerima',
  GRADING: 'weightGrading',
  PANEN  : 'weightPanen',
};

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

    const { weightType, weight, location, note } = await req.json();

    if (!weightType || !VALID_TYPES.includes(weightType))
      return NextResponse.json({
        message: `weightType tidak valid. Pilihan: ${VALID_TYPES.join(', ')}`,
      }, { status: 400 });

    const kg = parseFloat(weight);
    if (!kg || kg <= 0)
      return NextResponse.json({ message: 'Nilai bobot tidak valid.' }, { status: 400 });

    const recordedBy = session.user.name || session.user.email;

    // 1. Buat CattleWeightRecord
    await prisma.cattleWeightRecord.create({
      data: {
        cattleId  : id,
        weightType,
        weight    : kg,
        location  : location || null,
        note      : note || null,
        recordedBy,
      },
    });

    // 2. Update field shortcut di Cattle
    const cattleUpdate = { [FIELD_MAP[weightType]]: kg };

    // 3. Update tanggal jika relevan
    if (weightType === 'TERIMA' || weightType === 'PANEN') {
      cattleUpdate.lastWeightDate = new Date();
    }

    // 4. Auto-kalkulasi susut (BELI ↔ TERIMA)
    if (weightType === 'BELI' || weightType === 'TERIMA') {
      const existing = await prisma.cattle.findUnique({
        where : { id: id },
        select: { weightBeli: true, weightTerima: true },
      });

      const beli   = weightType === 'BELI'   ? kg : existing?.weightBeli;
      const terima = weightType === 'TERIMA' ? kg : existing?.weightTerima;

      if (beli && terima) {
        const susutPct = ((beli - terima) / beli) * 100;
        cattleUpdate.susutPct = parseFloat(susutPct.toFixed(2));
      }
    }

    const updated = await prisma.cattle.update({
      where: { id: id },
      data : cattleUpdate,
    });

    const susutPct  = updated.susutPct;
    const susutWarn = susutPct != null && susutPct > 8.0;
    const susutCrit = susutPct != null && susutPct > 8.5;

    return NextResponse.json({
      message : `Bobot ${weightType} (${kg} kg) berhasil disimpan.`,
      cattle  : updated,
      susutPct,
      warning : susutWarn
        ? `Susut ${susutPct.toFixed(1)}%${susutCrit ? ' — KRITIS (>8.5%)' : ' — Perhatian (>8.0%)'}`
        : null,
    });
  } catch (err) {
    console.error('CATTLE_WEIGHT_POST:', err);
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

    const records = await prisma.cattleWeightRecord.findMany({
      where  : { cattleId: id },
      orderBy: { recordedAt: 'desc' },
    });

    // Rekonstruksi timeline susut dari data historis
    const beli   = records.find((r) => r.weightType === 'BELI');
    const terima = records.find((r) => r.weightType === 'TERIMA');
    const susutTimeline = beli && terima
      ? { susutKg: beli.weight - terima.weight, susutPct: ((beli.weight - terima.weight) / beli.weight) * 100 }
      : null;

    return NextResponse.json({ records, susutTimeline });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}