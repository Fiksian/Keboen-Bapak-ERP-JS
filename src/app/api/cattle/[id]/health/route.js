// /app/api/cattle/[id]/health/route.js
// POST — Tambah catatan kesehatan + update healthStatus di Cattle
// GET  — Riwayat catatan kesehatan
// ============================================================

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

const ALLOWED       = ['SuperAdmin', 'Admin', 'Supervisor', 'Staff'];
const VALID_HEALTH  = ['SEHAT', 'SAKIT', 'OBSERVASI', 'KARANTINA'];

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

    const { healthStatus, diagnosis, treatment, treatedBy, note } = await req.json();

    if (!healthStatus || !VALID_HEALTH.includes(healthStatus))
      return NextResponse.json({
        message: `healthStatus tidak valid. Pilihan: ${VALID_HEALTH.join(', ')}`,
      }, { status: 400 });

    const updateData = { healthStatus };

    // Jika KARANTINA, update status sapi sekaligus
    if (healthStatus === 'KARANTINA') {
      updateData.status = 'KARANTINA';
    }
    // Jika SEHAT (recovery), kembalikan ke IN_KANDANG
    if (healthStatus === 'SEHAT') {
      const existing = await prisma.cattle.findUnique({
        where : { id: id },
        select: { status: true },
      });
      if (existing?.status === 'KARANTINA') {
        updateData.status = 'IN_KANDANG';
      }
    }

    await prisma.$transaction([
      prisma.cattleHealthRecord.create({
        data: {
          cattleId    : id,
          healthStatus,
          diagnosis   : diagnosis?.trim()  || null,
          treatment   : treatment?.trim()  || null,
          treatedBy   : treatedBy?.trim()  || session.user.name || session.user.email,
          note        : note?.trim()       || null,
          recoveredAt : healthStatus === 'SEHAT' ? new Date() : null,
        },
      }),
      prisma.cattle.update({
        where: { id: id },
        data : updateData,
      }),
    ]);

    return NextResponse.json({
      message: `Status kesehatan diperbarui: ${healthStatus}.`,
    });
  } catch (err) {
    console.error('CATTLE_HEALTH_POST:', err);
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

    const records = await prisma.cattleHealthRecord.findMany({
      where  : { cattleId: id },
      orderBy: { recordedAt: 'desc' },
    });

    // Hitung durasi sakit untuk kasus yang sudah pulih
    const enriched = records.map((r) => ({
      ...r,
      durationDays: r.recoveredAt
        ? Math.round((new Date(r.recoveredAt) - new Date(r.recordedAt)) / (1000 * 60 * 60 * 24))
        : null,
    }));

    return NextResponse.json(enriched);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}