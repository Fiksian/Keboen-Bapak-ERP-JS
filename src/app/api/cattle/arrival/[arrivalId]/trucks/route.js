// /api/cattle/arrival/[arrivalId]/trucks/route.js
// GET — Ambil data CattleTruck (susut per armada) berdasarkan arrivalId
//
// Response:
// {
//   trucks: [
//     { id, noTruk, headCount, grossWeight, tareWeight, netWeight,
//       avgWeightPerHead, supirTruk, weighedAt, notes }
//   ]
// }

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req, { params }) {
  const { arrivalId } = params;

  if (!arrivalId) {
    return NextResponse.json({ error: 'arrivalId diperlukan' }, { status: 400 });
  }

  try {
    const trucks = await prisma.cattleTruck.findMany({
      where: { arrivalId },
      orderBy: { weighedAt: 'asc' },
      select: {
        id              : true,
        noTruk          : true,
        supirTruk       : true,
        grossWeight     : true,
        tareWeight      : true,
        netWeight       : true,
        headCount       : true,
        avgWeightPerHead: true,
        notes           : true,
        weighedAt       : true,
      },
    });

    // Hitung susut per truk
    const trucksWithSusut = trucks.map((t) => {
      const susutKg  = t.grossWeight - t.netWeight;
      const susutPct = t.grossWeight > 0 ? (susutKg / t.grossWeight) * 100 : 0;
      const susutAlert = susutPct > 8.5;
      return { ...t, susutKg, susutPct, susutAlert };
    });

    return NextResponse.json({ trucks: trucksWithSusut });
  } catch (err) {
    console.error('[GET] /api/cattle/arrival/[arrivalId]/trucks', err);
    return NextResponse.json({ error: 'Gagal mengambil data armada' }, { status: 500 });
  }
}
