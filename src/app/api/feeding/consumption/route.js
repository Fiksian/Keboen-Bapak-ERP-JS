// /app/api/feeding/consumption/route.js
// GET  — List log konsumsi + summary
// POST — Catat konsumsi + FIFO deduction dari StockBatch per bahan formula
// ============================================================
// FIFO: deductStockFIFO(itemName, warehouseId, qty) per bahan,
//       proporsional dari amountGiven.
//       warehouseId: dari RationIngredient.warehouseId,
//       fallback ke body.stockWarehouseId (gudang stok bahan pakan).
// ============================================================

import { NextResponse }                        from 'next/server';
import { getServerSession }                    from 'next-auth';
import { authOptions }                         from '@/app/api/auth/[...nextauth]/route';
import prisma                                  from '@/lib/prisma';
import { deductStockFIFO, syncStockFromBatches } from '@/lib/fifoService';

const ALLOWED = ['SuperAdmin', 'Admin', 'Supervisor', 'Staff'];

// ─── GET ────────────────────────────────────────────────────
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');
    const from        = searchParams.get('from');
    const to          = searchParams.get('to');
    const take        = Math.min(parseInt(searchParams.get('take') || '50'), 200);

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to)   where.date.lte = new Date(new Date(to).setHours(23, 59, 59, 999));
    }

    const [logs, agg] = await Promise.all([
      prisma.feedConsumptionLog.findMany({
        where,
        orderBy: { date: 'desc' },
        take,
        include: {
          formula  : { select: { id: true, name: true, totalCostPerKg: true } },
          warehouse: { select: { id: true, name: true } },
        },
      }),
      prisma.feedConsumptionLog.aggregate({
        where,
        _sum: { amountGiven: true, amountConsumed: true, amountWasted: true, estimatedCost: true },
      }),
    ]);

    const totalGiven    = agg._sum.amountGiven    ?? 0;
    const totalConsumed = agg._sum.amountConsumed ?? 0;
    const totalWasted   = agg._sum.amountWasted   ?? 0;
    const totalCost     = agg._sum.estimatedCost  ?? 0;
    const wasteRate     = totalGiven > 0 ? (totalWasted / totalGiven) * 100 : 0;

    return NextResponse.json({
      logs,
      summary: {
        totalGiven   : parseFloat(totalGiven.toFixed(2)),
        totalConsumed: parseFloat(totalConsumed.toFixed(2)),
        totalWasted  : parseFloat(totalWasted.toFixed(2)),
        totalCost    : parseFloat(totalCost.toFixed(0)),
        wasteRate    : parseFloat(wasteRate.toFixed(1)),
        count        : logs.length,
      },
    });
  } catch (err) {
    console.error('CONSUMPTION_GET:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── POST ───────────────────────────────────────────────────
// Body:
// {
//   warehouseId      : ID kandang (opsional, untuk log)
//   cattleId         : ID sapi (opsional, per individu)
//   rationFormulaId  : ID formula
//   scheduleId       : ID jadwal (opsional, auto-complete jika diisi)
//   stockWarehouseId : ID warehouse SUMBER STOK bahan pakan
//                      (fallback jika RationIngredient.warehouseId kosong)
//   amountGiven      : float, kg total yang diberikan
//   amountWasted     : float, kg sisa (default 0)
//   headCount        : int, jumlah ekor
//   date             : ISO date string
//   notes            : string
// }
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED.includes(session.user?.role))
      return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

    const body = await req.json();
    const {
      warehouseId,
      cattleId,
      rationFormulaId,
      scheduleId,
      stockWarehouseId,   // warehouse sumber stok bahan pakan
      amountGiven,
      amountWasted  = 0,
      headCount,
      date,
      notes,
    } = body;

    // ── Validasi dasar ──────────────────────────────────────
    if (!rationFormulaId)
      return NextResponse.json({ message: 'rationFormulaId wajib diisi.' }, { status: 400 });
    if (!warehouseId && !cattleId)
      return NextResponse.json({ message: 'Sertakan warehouseId (kandang) atau cattleId.' }, { status: 400 });

    const given  = parseFloat(amountGiven);
    const wasted = parseFloat(amountWasted);

    if (isNaN(given) || given <= 0)
      return NextResponse.json({ message: 'amountGiven harus > 0.' }, { status: 400 });
    if (isNaN(wasted) || wasted < 0)
      return NextResponse.json({ message: 'amountWasted tidak boleh negatif.' }, { status: 400 });
    if (wasted > given)
      return NextResponse.json({ message: 'Sisa pakan tidak boleh melebihi pakan yang diberikan.' }, { status: 400 });

    const consumed  = parseFloat((given - wasted).toFixed(3));
    const head      = headCount ? parseInt(headCount) : null;
    const kgPerHead = consumed > 0 && head ? parseFloat((consumed / head).toFixed(3)) : null;
    const createdBy = session.user.name || session.user.email;

    // ── Ambil formula beserta komposisi bahan ───────────────
    const formula = await prisma.rationFormula.findUnique({
      where  : { id: rationFormulaId },
      include: {
        ingredients: {
          orderBy: { qtyKgPerBatch: 'desc' },
        },
      },
    });
    if (!formula)
      return NextResponse.json({ message: 'Formula tidak ditemukan.' }, { status: 404 });

    const estimatedCost = parseFloat((given * formula.totalCostPerKg).toFixed(2));
    const deductionRef  = `FEED-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const totalIngKg    = formula.ingredients.reduce((s, i) => s + i.qtyKgPerBatch, 0);

    // ── Transaction ─────────────────────────────────────────
    const shortfalls = [];
    const deductions = [];
    let   logRecord  = null;

    await prisma.$transaction(async (tx) => {

      // 1. FIFO deduction per bahan, proporsional dari amountGiven
      for (const ing of formula.ingredients) {
        const proportion  = totalIngKg > 0 ? ing.qtyKgPerBatch / totalIngKg : 0;
        const qtyNeeded   = parseFloat((given * proportion).toFixed(3));
        if (qtyNeeded <= 0) continue;

        // Sumber stok: RationIngredient.warehouseId → fallback stockWarehouseId → skip
        const srcWarehouse = ing.warehouseId || stockWarehouseId || null;
        if (!srcWarehouse) {
          shortfalls.push({
            ingredient: ing.itemName,
            needed    : qtyNeeded,
            reason    : 'Warehouse sumber stok tidak diketahui',
          });
          continue;
        }

        // Cek ketersediaan stok sebelum deduct
        const stockEntry = await tx.stock.findFirst({
          where : { name: ing.itemName, warehouseId: srcWarehouse },
          select: { stock: true, name: true },
        });

        if (!stockEntry || stockEntry.stock < qtyNeeded) {
          shortfalls.push({
            ingredient: ing.itemName,
            needed    : qtyNeeded,
            available : stockEntry?.stock ?? 0,
            shortfall : qtyNeeded - (stockEntry?.stock ?? 0),
          });
          // Tetap lanjut deduct semampu stok (partial), tidak stop seluruh transaksi
        }

        const result = await deductStockFIFO(
          tx,
          ing.itemName,
          srcWarehouse,
          qtyNeeded,
          deductionRef,
          'FEEDING',
          `FEED/${formula.name}`,
          createdBy,
          `Formula: ${formula.name} | ${given} kg diberikan | ${new Date(date || Date.now()).toLocaleDateString('id-ID')}`
        );

        if (!result.success && !shortfalls.find((s) => s.ingredient === ing.itemName)) {
          shortfalls.push({
            ingredient: ing.itemName,
            needed    : qtyNeeded,
            available : result.totalDeducted,
            shortfall : result.shortfall,
          });
        }

        // Sync tabel Stock agar angka konsisten
        if (result.totalDeducted > 0) {
          await syncStockFromBatches(tx, ing.itemName, srcWarehouse);
          deductions.push(
            ...result.deductions.map((d) => ({ ...d, ingredient: ing.itemName }))
          );
        }
      }

      // 2. Buat consumption log
      logRecord = await tx.feedConsumptionLog.create({
        data: {
          date            : date ? new Date(date) : new Date(),
          warehouseId     : warehouseId    || null,
          cattleId        : cattleId       || null,
          rationFormulaId,
          scheduleId      : scheduleId     || null,
          amountGiven     : given,
          amountWasted    : wasted,
          amountConsumed  : consumed,
          headCount       : head,
          kgPerHead,
          estimatedCost,
          deductionRef,
          isStockDeducted : shortfalls.length === 0,
          createdBy,
          notes           : notes?.trim()  || null,
        },
      });

      // 3. Auto-complete jadwal jika scheduleId diisi
      if (scheduleId) {
        await tx.feedingSchedule.update({
          where: { id: scheduleId },
          data : { status: 'COMPLETED', completedAt: new Date(), completedBy: createdBy },
        });
      }

      // 4. History audit (format sesuai History model yang sudah ada)
      await tx.history.create({
        data: {
          action     : 'FEED_CONSUMPTION',
          item       : formula.name,
          category   : 'PAKAN',
          type       : 'STOCKS',
          quantity   : -given,
          unit       : 'KG',
          user       : createdBy,
          referenceId: logRecord.id,
          notes      : [
            `Formula: ${formula.name}`,
            `Diberikan: ${given} kg`,
            `Dikonsumsi: ${consumed} kg | Sisa: ${wasted} kg`,
            head     ? `Ekor: ${head} (${kgPerHead} kg/ekor)` : null,
            warehouseId ? `Kandang: ${warehouseId}` : null,
            shortfalls.length > 0
              ? `⚠ Stok kurang: ${shortfalls.map((s) => s.ingredient).join(', ')}`
              : `FIFO OK: ${deductions.length} batch dipotong`,
          ].filter(Boolean).join(' | '),
        },
      });
    });

    return NextResponse.json({
      message        : `Konsumsi ${given} kg formula "${formula.name}" berhasil dicatat.`,
      logId          : logRecord?.id,
      deductionRef,
      batchesDeducted: deductions.length,
      shortfalls     : shortfalls.length > 0 ? shortfalls : undefined,
      warning        : shortfalls.length > 0
        ? `⚠ Stok tidak mencukupi untuk: ${shortfalls.map((s) => s.ingredient).join(', ')}. Log tetap disimpan.`
        : null,
      estimatedCost,
      consumed,
      kgPerHead,
    }, { status: 201 });

  } catch (err) {
    console.error('CONSUMPTION_POST:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
