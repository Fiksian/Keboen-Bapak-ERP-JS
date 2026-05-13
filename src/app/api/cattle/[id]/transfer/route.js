// /app/api/cattle/[id]/transfer/route.js
// POST — Pindah satu sapi ke kandang lain
// GET  — Riwayat transfer sapi ini
// ============================================================

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

const ALLOWED = ['SuperAdmin', 'Admin', 'Supervisor'];

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

    const { toWarehouseId, reason, note } = await req.json();

    if (!toWarehouseId)
      return NextResponse.json({ message: 'Kandang tujuan wajib diisi.' }, { status: 400 });

    const [cattle, toWarehouse] = await Promise.all([
      prisma.cattle.findUnique({ where: { id: id }, select: { warehouseId: true, status: true } }),
      prisma.warehouse.findUnique({ where: { id: toWarehouseId }, select: { id: true, name: true } }),
    ]);

    if (!cattle)      return NextResponse.json({ message: 'Sapi tidak ditemukan.' },          { status: 404 });
    if (!toWarehouse) return NextResponse.json({ message: 'Kandang tujuan tidak ditemukan.' },{ status: 404 });

    if (cattle.warehouseId === toWarehouseId)
      return NextResponse.json({ message: 'Sapi sudah berada di kandang tujuan.' }, { status: 400 });

    // ✅ Perbaiki mapping status - gunakan nilai yang valid di enum CattleStatus
    let newStatus = cattle.status;
    if (reason === 'Karantina') {
      newStatus = 'KARANTINA';
    } else if (reason === 'Grading') {
      newStatus = 'GRADING';
    } else if (reason === 'Penjualan') {
      newStatus = 'SOLD';
    }
    // Untuk alasan lain seperti 'Penggemukan', 'Perawatan', 'Lainnya', status tetap IN_KANDANG

    await prisma.$transaction([
      prisma.cattleTransfer.create({
        data: {
          cattleId       : id,
          fromWarehouseId: cattle.warehouseId,
          toWarehouseId,
          transferredAt  : new Date(),
          transferredBy  : session.user.name || session.user.email,
          reason         : reason || null,
          note           : note   || null,
        },
      }),
      prisma.cattle.update({
        where: { id: id },
        data : { 
          warehouseId: toWarehouseId, 
          status: newStatus 
        },
      }),
    ]);

    return NextResponse.json({
      message        : `Sapi berhasil dipindah ke ${toWarehouse.name}.`,
      toWarehouseName: toWarehouse.name,
      newStatus,
    });
  } catch (err) {
    console.error('CATTLE_TRANSFER_POST:', err);
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

    const records = await prisma.cattleTransfer.findMany({
      where  : { cattleId: id },
      orderBy: { transferredAt: 'desc' },
      include: {
        fromWarehouse: { select: { id: true, name: true, code: true } },
        toWarehouse  : { select: { id: true, name: true, code: true } },
      },
    });
    return NextResponse.json(records);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}