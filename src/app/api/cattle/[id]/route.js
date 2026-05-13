// /app/api/cattle/[id]/route.js
// GET    — Detail sapi tunggal + riwayat berat lengkap
// PATCH  — Update status sapi (mis: IN_KANDANG → SOLD, pindah kandang)
// DELETE — Hapus sapi (SuperAdmin only)
// ============================================================

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import  prisma              from '@/lib/prisma';

const ALLOWED_UPDATE = ['SuperAdmin', 'Admin', 'Supervisor'];
const ALLOWED_DELETE = ['SuperAdmin'];

// ─── GET /api/cattle/[id] ────────────────────────────────────
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // ✅ AWALI params karena di Next.js 15+ params adalah Promise
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });
    }

    const cattle = await prisma.cattle.findUnique({
      where  : { id: id },
      include: {
        warehouse    : { select: { id: true, name: true, code: true } },
        arrival      : { select: { id: true, arrivalNo: true, createdAt: true } },
        weightHistory: { orderBy: { recordedAt: 'desc' } }, // semua riwayat
      },
    });

    if (!cattle) return NextResponse.json({ message: 'Sapi tidak ditemukan.' }, { status: 404 });

    // Kalkulasi pertumbuhan berat (weight gain)
    const history = cattle.weightHistory;
    const gain    = history.length >= 2
      ? history[0].weight - history[history.length - 1].weight
      : null;

    return NextResponse.json({ ...cattle, weightGain: gain });

  } catch (err) {
    console.error('CATTLE_GET_SINGLE:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── PATCH /api/cattle/[id] ──────────────────────────────────
// Body: { status?, warehouseId?, weight?, name? }
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED_UPDATE.includes(session.user?.role)) {
      return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });
    }

    // ✅ AWALI params
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });
    }

    const body         = await req.json();
    const { status, warehouseId, weight, name } = body;

    // Validasi status enum
    const VALID_STATUS = ['ARRIVAL', 'IN_KANDANG', 'SOLD'];
    if (status && !VALID_STATUS.includes(status)) {
      return NextResponse.json({ message: `Status tidak valid. Pilihan: ${VALID_STATUS.join(', ')}` }, { status: 400 });
    }

    // Cek sapi ada
    const existing = await prisma.cattle.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ message: 'Sapi tidak ditemukan.' }, { status: 404 });

    // Jika ada update berat, tambahkan ke history
    const updateData = {};
    if (status)      updateData.status      = status;
    if (name)        updateData.name        = name;
    if (warehouseId) updateData.warehouseId = warehouseId; // Jangan parseInt karena ID string

    if (weight !== undefined && weight !== null) {
      const newWeight = parseFloat(weight);
      updateData.weight         = newWeight;
      updateData.lastWeightDate = new Date();
      updateData.weightHistory  = {
        create: {
          weight    : newWeight,
          recordedBy: session.user.name || session.user.email,
          note      : `Manual update via dashboard`,
        },
      };
    }

    const updated = await prisma.cattle.update({
      where  : { id: id },
      data   : updateData,
      include: { warehouse: { select: { name: true } } },
    });

    return NextResponse.json({
      message: 'Data sapi berhasil diperbarui.',
      cattle : updated,
    });

  } catch (err) {
    console.error('CATTLE_PATCH_ERROR:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── DELETE /api/cattle/[id] ─────────────────────────────────
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED_DELETE.includes(session.user?.role)) {
      return NextResponse.json({ message: 'Hanya SuperAdmin yang dapat menghapus data sapi.' }, { status: 403 });
    }

    // ✅ AWALI params
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });
    }

    const existing = await prisma.cattle.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ message: 'Sapi tidak ditemukan.' }, { status: 404 });

    // Cascade delete via Prisma (CattleWeightHistory otomatis ikut terhapus)
    await prisma.cattle.delete({ where: { id: id } });

    return NextResponse.json({ message: `Sapi ${id} berhasil dihapus.` });

  } catch (err) {
    console.error('CATTLE_DELETE_ERROR:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}