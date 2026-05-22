// /app/api/feeding/ingredient/route.js
// GET  — List semua bahan pakan + stok live dari Stock table
// POST — Daftarkan bahan pakan baru (link nama ke Stock.name)
// ============================================================
// FeedIngredient.name HARUS sama persis dengan Stock.name
// agar FIFO deduction bisa menemukan batch yang tepat.
// ============================================================

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

const ALLOWED_WRITE = ['SuperAdmin', 'Admin', 'Supervisor'];

// ─── GET ────────────────────────────────────────────────────
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');
    const includeAll  = searchParams.get('includeAll') === 'true'; // termasuk nonaktif

    const ingredients = await prisma.feedIngredient.findMany({
      where  : includeAll ? {} : { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { rationItems: true } },
      },
    });

    // Enrich dengan stok live jika warehouseId tersedia
    if (warehouseId) {
      const names     = ingredients.map((i) => i.name);
      const stockList = await prisma.stock.findMany({
        where : { name: { in: names }, warehouseId },
        select: { name: true, stock: true, unit: true, status: true },
      });
      const stockMap = new Map(stockList.map((s) => [s.name, s]));

      // Hitung stok total dari semua batch aktif (lebih akurat dari Stock.stock)
      const batchAgg = await prisma.stockBatch.groupBy({
        by   : ['itemName'],
        where: {
          itemName  : { in: names },
          warehouseId,
          status    : 'ACTIVE',
        },
        _sum: { qtyRemaining: true },
      });
      const batchMap = new Map(batchAgg.map((b) => [b.itemName, b._sum.qtyRemaining ?? 0]));

      return NextResponse.json(
        ingredients.map((i) => ({
          ...i,
          currentStock : stockMap.get(i.name)?.stock ?? null,
          batchStock   : batchMap.get(i.name)        ?? null,  // dari FIFO batch (lebih akurat)
          stockUnit    : stockMap.get(i.name)?.unit  ?? i.unit,
          stockStatus  : stockMap.get(i.name)?.status ?? 'UNKNOWN',
          usedInFormulas: i._count.rationItems,
        }))
      );
    }

    return NextResponse.json(
      ingredients.map((i) => ({ ...i, usedInFormulas: i._count.rationItems }))
    );
  } catch (err) {
    console.error('INGREDIENT_GET:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── POST ───────────────────────────────────────────────────
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED_WRITE.includes(session.user?.role))
      return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

    const { name, unit, pricePerKg, description, category } = await req.json();

    if (!name?.trim())
      return NextResponse.json({ message: 'Nama bahan wajib diisi.' }, { status: 400 });

    const ingredient = await prisma.feedIngredient.create({
      data: {
        name       : name.trim(),
        unit       : unit?.toUpperCase() || 'KG',
        pricePerKg : parseFloat(pricePerKg) || 0,
        description: description?.trim()    || null,
        category   : category               || 'PAKAN',
      },
    });

    return NextResponse.json({
      message   : `Bahan "${ingredient.name}" berhasil didaftarkan.`,
      ingredient,
    }, { status: 201 });

  } catch (err) {
    console.error('INGREDIENT_POST:', err);
    if (err.code === 'P2002')
      return NextResponse.json({ message: 'Nama bahan pakan sudah terdaftar.' }, { status: 409 });
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}


// ============================================================
// /app/api/feeding/ingredient/[id]/route.js
// PATCH  — Update harga atau keterangan bahan
// DELETE — Soft delete (isActive = false)
// ============================================================

export async function PATCH_INGREDIENT_ID(req, { params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !ALLOWED_WRITE.includes(session.user?.role))
    return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

  try {
    const { pricePerKg, description, unit, isActive } = await req.json();

    const data = {};
    if (pricePerKg  !== undefined) data.pricePerKg  = parseFloat(pricePerKg);
    if (description !== undefined) data.description = description?.trim() || null;
    if (unit        !== undefined) data.unit        = unit.toUpperCase();
    if (isActive    !== undefined) data.isActive    = Boolean(isActive);

    if (!Object.keys(data).length)
      return NextResponse.json({ message: 'Tidak ada field yang diperbarui.' }, { status: 400 });

    const updated = await prisma.feedIngredient.update({ where: { id }, data });

    // Jika harga berubah, perlu recalculate semua formula yang menggunakan bahan ini
    if (pricePerKg !== undefined) {
      const rationItems = await prisma.rationIngredient.findMany({
        where  : { feedIngredientId: id },
        include: { formula: { include: { ingredients: { include: { ingredient: true } } } } },
      });

      // Recalculate setiap formula yang terkait
      const uniqueFormulaIds = [...new Set(rationItems.map((r) => r.rationFormulaId))];
      for (const fId of uniqueFormulaIds) {
        const formula = await prisma.rationFormula.findUnique({
          where  : { id: fId },
          include: { ingredients: { include: { ingredient: true } } },
        });
        if (!formula) continue;

        let totalCost = 0;
        let totalKg   = 0;
        const updates = [];

        for (const ing of formula.ingredients) {
          const price     = ing.feedIngredientId === id ? parseFloat(pricePerKg) : ing.ingredient.pricePerKg;
          const cost      = ing.qtyKgPerBatch * price;
          totalCost      += cost;
          totalKg        += ing.qtyKgPerBatch;
          updates.push({ id: ing.id, costContribution: cost });
        }

        const newCostPerKg = totalKg > 0 ? totalCost / totalKg : 0;

        // Update cost contribution per bahan + totalCostPerKg di formula
        await prisma.$transaction([
          ...updates.map((u) => prisma.rationIngredient.update({ where: { id: u.id }, data: { costContribution: u.costContribution } })),
          prisma.rationFormula.update({
            where: { id: fId },
            data : { totalCostPerKg: parseFloat(newCostPerKg.toFixed(2)) },
          }),
        ]);
      }
    }

    return NextResponse.json({
      message   : `Bahan "${updated.name}" diperbarui.`,
      ingredient: updated,
      note      : pricePerKg !== undefined ? 'Harga formula terkait telah di-recalculate.' : undefined,
    });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function DELETE_INGREDIENT_ID(req, { params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !ALLOWED_WRITE.includes(session.user?.role))
    return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

  try {
    const usedIn = await prisma.rationIngredient.count({ where: { feedIngredientId: id } });
    if (usedIn > 0)
      return NextResponse.json({
        message: `Bahan masih digunakan di ${usedIn} formula. Hapus dari formula terlebih dahulu.`,
      }, { status: 400 });

    const updated = await prisma.feedIngredient.update({
      where: { id },
      data : { isActive: false },
    });
    return NextResponse.json({ message: `Bahan "${updated.name}" dinonaktifkan.` });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
