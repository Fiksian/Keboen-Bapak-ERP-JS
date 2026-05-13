// /app/api/warehouse/route.js
// GET  — List semua warehouse, opsional sertakan data sapi (includeCattle=true)
// POST — Tambah warehouse baru
// ============================================================

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeCattle = searchParams.get('includeCattle') === 'true';
    const warehouseId = searchParams.get('id');
    const isKandang = searchParams.get('isKandang') === 'true';

    // ── Single warehouse ──────────────────────────────────
    if (warehouseId && warehouseId !== 'undefined') {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId },
        include: includeCattle
          ? {
              cattle: {
                orderBy: { updatedAt: 'desc' },
                include: {
                  weightHistory: {
                    orderBy: { recordedAt: 'desc' },
                    take: 5,
                  },
                },
              },
              _count: { select: { cattle: true } },
            }
          : { _count: { select: { cattle: true } } },
      });

      if (!warehouse) {
        return NextResponse.json({ message: 'Warehouse tidak ditemukan.' }, { status: 404 });
      }

      return NextResponse.json(warehouse);
    }

    // ── All warehouses ────────────────────────────────────
    // Filter untuk kandang (opsional)
    const where = isKandang
      ? {
          OR: [
            { name: { contains: 'KANDANG', mode: 'insensitive' } },
            { code: { contains: 'KD', mode: 'insensitive' } },
          ],
        }
      : {};

    const warehouses = await prisma.warehouse.findMany({
      where,
      orderBy: { name: 'asc' },
      include: includeCattle
        ? {
            // Sertakan cattle untuk kalkulasi berat total per kandang
            cattle: {
              select: {
                id: true,
                rfidNo: true,
                name: true,
                weight: true,           // ← Gunakan 'weight', bukan 'weightCurrent'
                status: true,
                lastWeightDate: true,
                lastScanAt: true,
                warehouseId: true,
                arrivalId: true,
                createdAt: true,
                updatedAt: true,
              },
              where: {
                status: { in: ['ARRIVAL', 'IN_KANDANG'] },
              },
            },
            _count: { select: { cattle: true } },
          }
        : { _count: { select: { cattle: true } } },
    });

    return NextResponse.json(warehouses);

  } catch (err) {
    console.error('WAREHOUSE_GET_ERROR:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Hanya admin yang bisa menambah warehouse
    if (!['SuperAdmin', 'Admin'].includes(session.user.role)) {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, address } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'Nama warehouse wajib diisi.' }, { status: 400 });
    }

    // Cek duplikasi nama
    const existing = await prisma.warehouse.findFirst({
      where: {
        OR: [
          { name: name.trim() },
          code ? { code: code.trim() } : {},
        ],
      },
    });

    if (existing && existing.name === name.trim()) {
      return NextResponse.json({ message: `Warehouse "${name}" sudah terdaftar.` }, { status: 409 });
    }
    if (existing && existing.code === code?.trim()) {
      return NextResponse.json({ message: `Kode "${code}" sudah digunakan.` }, { status: 409 });
    }

    const newWarehouse = await prisma.warehouse.create({
      data: {
        name: name.trim(),
        code: code?.trim() || null,
        address: address?.trim() || null,
      },
    });

    return NextResponse.json({
      message: `Warehouse ${newWarehouse.name} berhasil ditambahkan.`,
      data: newWarehouse,
    }, { status: 201 });

  } catch (error) {
    console.error('WAREHOUSE_POST_ERROR:', error);
    return NextResponse.json({ message: 'Gagal menambah warehouse' }, { status: 500 });
  }
}

// ─── DELETE (Opsional) ───────────────────────────────────────────────────────
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!['SuperAdmin', 'Admin'].includes(session.user.role)) {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID warehouse diperlukan.' }, { status: 400 });
    }

    // Cek apakah warehouse memiliki relasi
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            cattle: true,
            cattlePurchasings: true,
            cattleArrivals: true,
            cattleBatches: true,
            stocks: true,
            batches: true,
          },
        },
      },
    });

    if (!warehouse) {
      return NextResponse.json({ message: 'Warehouse tidak ditemukan.' }, { status: 404 });
    }

    if (warehouse._count.cattle > 0 || warehouse._count.stocks > 0) {
      return NextResponse.json({
        message: `Warehouse "${warehouse.name}" tidak dapat dihapus karena masih memiliki data (${warehouse._count.cattle} sapi, ${warehouse._count.stocks} stok).`,
      }, { status: 400 });
    }

    await prisma.warehouse.delete({ where: { id } });

    return NextResponse.json({ message: `Warehouse ${warehouse.name} berhasil dihapus.` });

  } catch (error) {
    console.error('WAREHOUSE_DELETE_ERROR:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}