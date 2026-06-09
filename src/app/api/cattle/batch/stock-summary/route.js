// /api/cattle/batch/stock-summary/route.js
// GET — Ringkasan stok per jenis sapi (breed) untuk kandang tertentu
//
// Query params:
//   warehouseId  — ID kandang (wajib)
//
// Response:
// {
//   summary: [
//     {
//       breed          : "Limousin",
//       gender         : "JANTAN",
//       headInitial    : 50,
//       headRemaining  : 38,
//       headSold       : 12,
//       headDead       : 0,
//       totalWeightCurrent: 12350.5,
//       avgWeightReceived : 310.2,
//       avgWeightCurrent  : 325.0,
//     },
//     ...
//   ],
//   totalHeadRemaining : 120,
//   totalWeightCurrent : 39000,
//   avgWeightCurrent   : 325,
// }

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const warehouseId = searchParams.get('warehouseId');

  if (!warehouseId) {
    return NextResponse.json({ error: 'warehouseId diperlukan' }, { status: 400 });
  }

  try {
    // Ambil semua CattleBatch aktif di kandang ini
    const batches = await prisma.cattleBatch.findMany({
      where: {
        warehouseId,
        status: { in: ['ACTIVE', 'PARTIAL'] },
      },
      select: {
        id                : true,
        headInitial       : true,
        headRemaining     : true,
        headReserved      : true,
        headSold          : true,
        headDead          : true,
        avgWeightReceived : true,
        avgWeightCurrent  : true,
        totalWeightCurrent: true,
        // Ambil breed & gender dari CattleInventory di batch ini
        cattle: {
          select: {
            breed       : true,
            jenisKelamin: true,
            weightCurrent: true,
          },
          where: {
            locationStatus: { notIn: ['SOLD'] },
          },
        },
      },
    });

    // Agregasi per breed
    const breedMap = {};

    for (const batch of batches) {
      for (const c of batch.cattle) {
        const breed  = c.breed ?? 'Tidak Diketahui';
        const gender = c.jenisKelamin ?? 'CAMPUR';
        const key    = `${breed}::${gender}`;

        if (!breedMap[key]) {
          breedMap[key] = {
            breed,
            gender,
            headRemaining     : 0,
            totalWeightCurrent: 0,
          };
        }

        breedMap[key].headRemaining      += 1;
        breedMap[key].totalWeightCurrent += parseFloat(c.weightCurrent ?? 0);
      }

      // Tambahkan headSold dari batch (breed tidak diketahui per ekor yang sudah sold)
      // Kita estimasi dengan headSold batch-level
    }

    // Hitung sold per breed dari CattleInventory yang sudah SOLD
    const soldInventory = await prisma.cattleInventory.groupBy({
      by: ['breed', 'jenisKelamin'],
      where: {
        warehouseId,
        locationStatus: 'SOLD',
      },
      _count: { id: true },
    });

    for (const row of soldInventory) {
      const breed  = row.breed ?? 'Tidak Diketahui';
      const gender = row.jenisKelamin ?? 'CAMPUR';
      const key    = `${breed}::${gender}`;
      if (!breedMap[key]) {
        breedMap[key] = { breed, gender, headRemaining: 0, totalWeightCurrent: 0 };
      }
      breedMap[key].headSold = row._count.id;
    }

    const summary = Object.values(breedMap).map((s) => ({
      ...s,
      headSold         : s.headSold ?? 0,
      avgWeightCurrent : s.headRemaining > 0
        ? parseFloat((s.totalWeightCurrent / s.headRemaining).toFixed(2))
        : 0,
    })).sort((a, b) => b.headRemaining - a.headRemaining);

    const totalHeadRemaining  = summary.reduce((acc, s) => acc + s.headRemaining, 0);
    const totalWeightCurrent  = summary.reduce((acc, s) => acc + s.totalWeightCurrent, 0);
    const avgWeightCurrent    = totalHeadRemaining > 0
      ? parseFloat((totalWeightCurrent / totalHeadRemaining).toFixed(2))
      : 0;

    return NextResponse.json({
      summary,
      totalHeadRemaining,
      totalWeightCurrent,
      avgWeightCurrent,
    });
  } catch (err) {
    console.error('[GET] /api/cattle/batch/stock-summary', err);
    return NextResponse.json({ error: 'Gagal mengambil ringkasan stok' }, { status: 500 });
  }
}
