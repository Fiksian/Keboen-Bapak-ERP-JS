// /app/api/feeding/ration/route.js
// GET  — List semua formula ransum
// POST — Buat formula, kalkulasi cost dari Stock.price
// ============================================================
// Bahan baku = Stock.name di warehouse tertentu.
// Tidak ada model FeedIngredient — langsung query Stock.
// ============================================================

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

const ALLOWED = ['SuperAdmin', 'Admin', 'Supervisor'];

// ─── GET ────────────────────────────────────────────────────
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const formulas = await prisma.rationFormula.findMany({
      where  : activeOnly ? { isActive: true } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        ingredients: true,
        _count: { select: { schedules: true, consumptions: true } },
      },
    });

    return NextResponse.json(formulas);
  } catch (err) {
    console.error('RATION_GET:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── POST ───────────────────────────────────────────────────
// Body:
// {
//   name, description, targetKgPerHead,
//   ingredients: [
//     { itemName: "KONSENTRAT", warehouseId: "...", qtyKgPerBatch: 60 },
//     { itemName: "SILASE JAGUNG", warehouseId: "...", qtyKgPerBatch: 30 },
//   ]
// }
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED.includes(session.user?.role))
      return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

    const { name, description, targetKgPerHead, ingredients } = await req.json();

    if (!name?.trim())
      return NextResponse.json({ message: 'Nama formula wajib diisi.' }, { status: 400 });
    if (!ingredients?.length)
      return NextResponse.json({ message: 'Minimal 1 bahan diperlukan.' }, { status: 400 });

    // Validasi qty
    for (const ing of ingredients) {
      if (!ing.itemName?.trim())
        return NextResponse.json({ message: 'Nama item bahan tidak boleh kosong.' }, { status: 400 });
      if (!parseFloat(ing.qtyKgPerBatch) || parseFloat(ing.qtyKgPerBatch) <= 0)
        return NextResponse.json({ message: `Qty untuk "${ing.itemName}" harus > 0.` }, { status: 400 });
    }

    // Ambil harga dari Stock — cari per itemName + warehouseId (atau nama saja jika tidak ada warehouseId)
    // Stock.price disimpan sebagai String, parse ke Float
    const priceMap = new Map();
    const unitMap  = new Map();

    for (const ing of ingredients) {
      const where = { name: ing.itemName };
      if (ing.warehouseId) where.warehouseId = ing.warehouseId;

      // Cari stock yang cocok — prioritaskan dengan warehouseId, fallback ke tanpa warehouse
      const stock = await prisma.stock.findFirst({
        where  : ing.warehouseId
          ? { name: ing.itemName, warehouseId: ing.warehouseId }
          : { name: ing.itemName },
        select : { price: true, unit: true },
        orderBy: { updatedAt: 'desc' },
      });

      const pricePerKg = stock?.price ? parseFloat(stock.price) || 0 : 0;
      priceMap.set(ing.itemName, pricePerKg);
      unitMap.set(ing.itemName, stock?.unit || ing.unit || 'KG');
    }

    // Kalkulasi cost
    let totalCostBatch = 0;
    const ingData = [];

    for (const ing of ingredients) {
      const qty   = parseFloat(ing.qtyKgPerBatch);
      const price = priceMap.get(ing.itemName) || 0;
      const cost  = parseFloat((qty * price).toFixed(2));
      totalCostBatch += cost;
      ingData.push({
        itemName        : ing.itemName.trim(),
        warehouseId     : ing.warehouseId || null,
        unit            : unitMap.get(ing.itemName) || 'KG',
        qtyKgPerBatch   : qty,
        pctOfTotal      : 0,  // akan dihitung setelah tahu total
        priceSnapshot   : price,
        costContribution: cost,
      });
    }

    const totalIngKg     = ingData.reduce((s, i) => s + i.qtyKgPerBatch, 0);
    const totalCostPerKg = totalIngKg > 0 ? totalCostBatch / totalIngKg : 0;

    // Set pct
    for (const i of ingData) {
      i.pctOfTotal = totalIngKg > 0
        ? parseFloat(((i.qtyKgPerBatch / totalIngKg) * 100).toFixed(2))
        : 0;
    }

    const formula = await prisma.rationFormula.create({
      data: {
        name           : name.trim(),
        description    : description?.trim() || null,
        totalCostPerKg : parseFloat(totalCostPerKg.toFixed(2)),
        targetKgPerHead: targetKgPerHead ? parseFloat(targetKgPerHead) : null,
        createdBy      : session.user.name || session.user.email,
        ingredients    : { create: ingData },
      },
      include: { ingredients: true },
    });

    return NextResponse.json({
      message       : `Formula "${formula.name}" berhasil dibuat.`,
      formula,
      totalCostPerKg: parseFloat(totalCostPerKg.toFixed(2)),
    }, { status: 201 });

  } catch (err) {
    console.error('RATION_POST:', err);
    if (err.code === 'P2002')
      return NextResponse.json({ message: 'Nama formula sudah digunakan.' }, { status: 409 });
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
