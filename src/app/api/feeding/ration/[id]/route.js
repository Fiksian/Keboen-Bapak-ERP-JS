// /app/api/feeding/ration/[id]/route.js
// GET    — Detail formula + stok bahan live dari Stock
// PATCH  — Update nama/deskripsi/target
// DELETE — Soft delete jika tidak ada jadwal aktif
// ============================================================

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

const ALLOWED = ['SuperAdmin', 'Admin', 'Supervisor'];

export async function GET(req, { params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const formula = await prisma.rationFormula.findUnique({
      where  : { id },
      include: {
        ingredients : { orderBy: { qtyKgPerBatch: 'desc' } },
        schedules   : {
          where  : { isActive: true },
          include: { warehouse: { select: { id: true, name: true } } },
          take   : 10,
        },
        consumptions: { orderBy: { date: 'desc' }, take: 10 },
      },
    });

    if (!formula) return NextResponse.json({ message: 'Formula tidak ditemukan.' }, { status: 404 });

    // Enrich: cek stok live dari Stock per bahan
    const itemNames = formula.ingredients.map((i) => i.itemName);
    const stockList = await prisma.stock.findMany({
      where  : { name: { in: itemNames } },
      select : { name: true, stock: true, unit: true, status: true, warehouseId: true },
      orderBy: { updatedAt: 'desc' },
    });

    // Map: itemName → best stock entry (per warehouseId jika ada, else first match)
    const stockMap = new Map();
    for (const s of stockList) {
      if (!stockMap.has(s.name)) stockMap.set(s.name, s); // ambil pertama
    }

    const enrichedIngredients = formula.ingredients.map((i) => {
      const s = stockMap.get(i.itemName);
      return {
        ...i,
        currentStock: s?.stock  ?? null,
        stockStatus : s?.status ?? 'UNKNOWN',
        stockUnit   : s?.unit   ?? i.unit,
        isStockOk   : (s?.stock ?? 0) >= i.qtyKgPerBatch,
      };
    });

    return NextResponse.json({ ...formula, ingredients: enrichedIngredients });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !ALLOWED.includes(session.user?.role))
    return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

  try {
    const { name, description, targetKgPerHead, isActive } = await req.json();

    const data = {};
    if (name            !== undefined) data.name            = name.trim();
    if (description     !== undefined) data.description     = description?.trim() || null;
    if (targetKgPerHead !== undefined) data.targetKgPerHead = parseFloat(targetKgPerHead);
    if (isActive        !== undefined) data.isActive        = Boolean(isActive);

    const updated = await prisma.rationFormula.update({ where: { id }, data });
    return NextResponse.json({ message: 'Formula diperbarui.', formula: updated });
  } catch (err) {
    if (err.code === 'P2002') return NextResponse.json({ message: 'Nama sudah digunakan.' }, { status: 409 });
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !ALLOWED.includes(session.user?.role))
    return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

  try {
    const activeSchedules = await prisma.feedingSchedule.count({
      where: { rationFormulaId: id, isActive: true },
    });
    if (activeSchedules > 0)
      return NextResponse.json({
        message: `Formula masih dipakai ${activeSchedules} jadwal aktif.`,
      }, { status: 400 });

    const updated = await prisma.rationFormula.update({
      where: { id },
      data : { isActive: false },
    });
    return NextResponse.json({ message: `Formula "${updated.name}" dinonaktifkan.` });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
