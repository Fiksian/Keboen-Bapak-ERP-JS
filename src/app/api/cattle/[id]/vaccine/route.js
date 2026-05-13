// /app/api/cattle/[id]/vaccine/route.js
// POST — Tambah vaksin, update vaccinated=true + lastVaccineDate di Cattle
// GET  — List riwayat vaksin + deteksi yang jatuh tempo
// ============================================================

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

const ALLOWED = ['SuperAdmin', 'Admin', 'Supervisor', 'Staff'];

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

    const {
      vaccineType, vaccineDate, doseNumber,
      nextDueDate, administeredBy, batchNo, note,
    } = await req.json();

    if (!vaccineType?.trim())
      return NextResponse.json({ message: 'Jenis vaksin wajib diisi.' }, { status: 400 });
    if (!vaccineDate)
      return NextResponse.json({ message: 'Tanggal vaksin wajib diisi.' }, { status: 400 });

    const parsedDate = new Date(vaccineDate);
    if (isNaN(parsedDate.getTime()))
      return NextResponse.json({ message: 'Format tanggal tidak valid.' }, { status: 400 });

    await prisma.$transaction([
      prisma.cattleVaccine.create({
        data: {
          cattleId      : id,
          vaccineType   : vaccineType.trim(),
          vaccineDate   : parsedDate,
          doseNumber    : parseInt(doseNumber) || 1,
          nextDueDate   : nextDueDate ? new Date(nextDueDate) : null,
          administeredBy: administeredBy?.trim() || session.user.name || session.user.email,
          batchNo       : batchNo?.trim() || null,
          note          : note?.trim() || null,
        },
      }),
      prisma.cattle.update({
        where: { id: id },
        data : {
          vaccinated     : true,
          lastVaccineDate: parsedDate,
        },
      }),
    ]);

    return NextResponse.json({
      message: `Vaksin ${vaccineType} (Dosis ${doseNumber || 1}) berhasil dicatat.`,
    });
  } catch (err) {
    console.error('CATTLE_VACCINE_POST:', err);
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

    const records = await prisma.cattleVaccine.findMany({
      where  : { cattleId: id },
      orderBy: { vaccineDate: 'desc' },
    });

    const now     = new Date();
    const overdue = records.filter((v) => v.nextDueDate && new Date(v.nextDueDate) < now);
    const upcoming = records.filter((v) => {
      if (!v.nextDueDate) return false;
      const due  = new Date(v.nextDueDate);
      const diff = (due - now) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30; // 30 hari ke depan
    });

    return NextResponse.json({ records, overdue, upcoming });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}