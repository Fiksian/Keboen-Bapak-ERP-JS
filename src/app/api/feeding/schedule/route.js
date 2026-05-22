// /app/api/feeding/schedule/route.js
// GET  — List jadwal + filter warehouseId / status
// POST — Buat jadwal baru
// ============================================================

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

const ALLOWED = ['SuperAdmin', 'Admin', 'Supervisor'];

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');
    const status      = searchParams.get('status');
    const activeOnly  = searchParams.get('activeOnly') !== 'false';

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (status)      where.status      = status;
    if (activeOnly)  where.isActive    = true;

    const schedules = await prisma.feedingSchedule.findMany({
      where,
      orderBy: [{ time: 'asc' }],
      include: {
        formula  : { select: { id: true, name: true, totalCostPerKg: true, targetKgPerHead: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        _count   : { select: { consumptions: true } },
      },
    });

    return NextResponse.json(schedules);
  } catch (err) {
    console.error('SCHEDULE_GET:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED.includes(session.user?.role))
      return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

    const {
      time, label, daysOfWeek,
      rationFormulaId, warehouseId,
      targetKgPerHead, headCount, notes,
    } = await req.json();

    if (!time || !rationFormulaId || !warehouseId)
      return NextResponse.json({ message: 'time, rationFormulaId, warehouseId wajib.' }, { status: 400 });

    if (!/^\d{2}:\d{2}$/.test(time))
      return NextResponse.json({ message: 'Format waktu HH:MM (mis: 07:00).' }, { status: 400 });

    const [formula, warehouse] = await Promise.all([
      prisma.rationFormula.findUnique({
        where : { id: rationFormulaId },
        select: { targetKgPerHead: true, name: true },
      }),
      prisma.warehouse.findUnique({
        where : { id: warehouseId },
        select: { name: true },
      }),
    ]);

    if (!formula)   return NextResponse.json({ message: 'Formula tidak ditemukan.' },  { status: 404 });
    if (!warehouse) return NextResponse.json({ message: 'Kandang tidak ditemukan.' }, { status: 404 });

    const kgPerHead = targetKgPerHead ? parseFloat(targetKgPerHead) : (formula.targetKgPerHead ?? null);
    const head      = headCount ? parseInt(headCount) : null;
    const totalKg   = kgPerHead && head ? parseFloat((kgPerHead * head).toFixed(2)) : null;

    const schedule = await prisma.feedingSchedule.create({
      data: {
        time,
        label           : label || null,
        daysOfWeek      : daysOfWeek || 'MON,TUE,WED,THU,FRI,SAT,SUN',
        rationFormulaId,
        warehouseId,
        targetKgPerHead : kgPerHead,
        headCount       : head,
        totalKgTarget   : totalKg,
        notes           : notes?.trim() || null,
      },
      include: {
        formula  : { select: { name: true, totalCostPerKg: true } },
        warehouse: { select: { name: true } },
      },
    });

    return NextResponse.json({
      message : `Jadwal ${time} (${label || '-'}) untuk ${warehouse.name} dibuat.`,
      schedule,
    }, { status: 201 });
  } catch (err) {
    console.error('SCHEDULE_POST:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}


// ============================================================
// /app/api/feeding/schedule/[id]/complete/route.js
// POST — Tandai jadwal COMPLETED (tanpa deduct stok)
//        Untuk catat konsumsi + deduct stok, gunakan /consumption
// ============================================================

export async function POST_COMPLETE(req, { params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !['SuperAdmin','Admin','Supervisor','Staff'].includes(session.user?.role))
    return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

  try {
    const { notes } = await req.json().catch(() => ({}));

    const schedule = await prisma.feedingSchedule.update({
      where: { id },
      data : {
        status     : 'COMPLETED',
        completedAt: new Date(),
        completedBy: session.user.name || session.user.email,
        ...(notes ? { notes } : {}),
      },
      include: {
        formula  : { select: { name: true } },
        warehouse: { select: { name: true } },
      },
    });

    return NextResponse.json({
      message : `Jadwal ${schedule.time} di ${schedule.warehouse?.name} selesai.`,
      schedule,
    });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
