// /app/api/cattle/[id]/route.js
// GET    — Detail sapi tunggal + riwayat berat lengkap + medikasi + kesehatan + transfer + hpp
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

    const { id } = await params;
    if (!id) return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });

    const cattle = await prisma.cattle.findUnique({
      where: { id },
      include: {
        warehouse    : { select: { id: true, name: true, code: true } },
        arrival      : { select: { id: true, arrivalNo: true, createdAt: true } },
        purchasing   : { select: { id: true, noPO: true, vendorName: true, hppPerEkor: true } },
        // Riwayat berat versi lama (weightHistory) – untuk backward compat
        weightHistory: { orderBy: { recordedAt: 'desc' } },
        // Riwayat berat versi baru (weightRecords)
        weightRecords: { orderBy: { recordedAt: 'desc' } },
        // Riwayat kesehatan
        healthRecords: { orderBy: { recordedAt: 'desc' } },
        // Riwayat medikasi (vaksin + obat)
        medications  : { orderBy: { givenDate: 'desc' } },
        // Riwayat transfer kandang
        transfers    : {
          include: {
            fromWarehouse: { select: { id: true, name: true } },
            toWarehouse  : { select: { id: true, name: true } },
          },
          orderBy: { transferredAt: 'desc' },
        },
        // Komponen HPP
        hppComponents: { orderBy: { date: 'desc' } },
      },
    });

    if (!cattle) return NextResponse.json({ message: 'Sapi tidak ditemukan.' }, { status: 404 });

    // Hitung weight gain dari weightHistory (atau dari weightRecords jika perlu)
    const history = cattle.weightHistory;
    const gain    = history.length >= 2 ? history[0].weight - history[history.length - 1].weight : null;

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

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });
    }

    const body         = await req.json();
    const { status, warehouseId, weight, name } = body;

    // Validasi status enum (gunakan CattleStatus enum dari schema)
    const VALID_STATUS = ['ARRIVAL', 'IN_KANDANG', 'GRADING', 'KARANTINA', 'PENDING_SALE', 'SOLD'];
    if (status && !VALID_STATUS.includes(status)) {
      return NextResponse.json({ message: `Status tidak valid. Pilihan: ${VALID_STATUS.join(', ')}` }, { status: 400 });
    }

    // Cek sapi ada
    const existing = await prisma.cattle.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ message: 'Sapi tidak ditemukan.' }, { status: 404 });

    // Jika ada update berat, tambahkan ke weightRecords dan weightHistory
    const updateData = {};
    if (status)      updateData.status      = status;
    if (name)        updateData.name        = name;
    if (warehouseId) updateData.warehouseId = warehouseId;

    if (weight !== undefined && weight !== null) {
      const newWeight = parseFloat(weight);
      updateData.weight         = newWeight;
      updateData.lastWeightDate = new Date();
      // Tambahkan ke weightRecords (model baru)
      updateData.weightRecords = {
        create: {
          weight    : newWeight,
          recordedBy: session.user.name || session.user.email,
          note      : `Manual update via dashboard`,
          weightType: 'TERIMA', // default, bisa disesuaikan
        },
      };
      // Juga tambahkan ke weightHistory (legacy) jika diperlukan
      updateData.weightHistory = {
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

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });
    }

    const existing = await prisma.cattle.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ message: 'Sapi tidak ditemukan.' }, { status: 404 });

    // Hapus sapi (cascade akan menghapus relasi seperti CattleWeightHistory, CattleMedication, dll karena onDelete: Cascade)
    await prisma.cattle.delete({ where: { id: id } });

    return NextResponse.json({ message: `Sapi ${id} berhasil dihapus.` });

  } catch (err) {
    console.error('CATTLE_DELETE_ERROR:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}