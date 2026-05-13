// /app/api/cattle/import-rfid/route.js  — v2
// POST — Import RFID + opsional harga beli → auto-calc hargaBeliTotal & weightBeli
// GET  — Daftar Cattle per Warehouse (include vaccinated, healthStatus, susutPct, hppPerEkor)
// ============================================================
// Update v2:
//  • FormData baru: hargaBeliPerKg, weightBeliOverride
//  • Setelah upsert: set weightBeli, hargaBeliPerKg, hargaBeliTotal
//  • GET: return field baru untuk tampilan di CattleDetailModal
// ============================================================

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';
import * as XLSX            from 'xlsx';

const ALLOWED = ['SuperAdmin', 'Admin', 'Supervisor', 'Staff'];

// ── Parser spreadsheet (sama dengan v1, pertahankan) ──────────
function parseSpreadsheet(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const rows     = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!rows || rows.length < 2) throw new Error('File kosong atau tidak memiliki data.');

  const headerRow = rows[0];

  let eidColIndex = headerRow.findIndex((c) => c && String(c).toUpperCase() === 'EID');
  if (eidColIndex === -1)
    eidColIndex = headerRow.findIndex((c) => c && /rfid|tag|id|eid/i.test(String(c)));
  if (eidColIndex === -1)
    throw new Error(`Kolom RFID/EID tidak ditemukan. Kolom: ${headerRow.join(', ')}`);

  const weightColIndex = headerRow.findIndex((c) => c && /weight|berat|kg/i.test(String(c)));

  const rfids = [];
  for (let i = 1; i < rows.length; i++) {
    const row    = rows[i];
    const eid    = row[eidColIndex];
    if (!eid) continue;

    const eidStr = String(eid).trim();
    if (['GROUP SEPARATOR', 'EID'].includes(eidStr)) continue;
    if (eidStr.toLowerCase().includes('sli')) continue;

    const cleanRfid = eidStr.replace(/\s+/g, '');
    if (!/^\d+$/.test(cleanRfid)) continue;

    let weight = 0;
    if (weightColIndex !== -1 && row[weightColIndex]) {
      const p = parseFloat(row[weightColIndex]);
      if (!isNaN(p) && p > 0) weight = p;
    }

    rfids.push({ rfid: cleanRfid, weight });
  }

  if (!rfids.length)
    throw new Error('Tidak ada data RFID valid dalam file.');

  return rfids;
}

// ─── POST ────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED.includes(session.user?.role))
      return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

    const formData = await req.formData();

    const file             = formData.get('file');
    const warehouseInput   = formData.get('warehouseId');
    const arrivalId        = formData.get('arrivalId')        || null;
    const defaultWeightStr = formData.get('defaultWeight')    || '450';
    const note             = formData.get('note')             || `Import RFID ${new Date().toLocaleDateString('id-ID')}`;

    // ── Field baru v2 ─────────────────────────────────────────
    // hargaBeliPerKg : harga beli per kg (IDR) — opsional
    // weightBeliOverride : jika berat beli di-override manual (bukan dari file)
    const hargaBeliPerKgStr   = formData.get('hargaBeliPerKg')    || null;
    const weightBeliOverride  = formData.get('weightBeliOverride') || null;

    if (!file)           return NextResponse.json({ message: 'File tidak ditemukan.' },         { status: 400 });
    if (!warehouseInput) return NextResponse.json({ message: 'Kandang tujuan wajib dipilih.' }, { status: 400 });

    // ── Cari warehouse ─────────────────────────────────────────
    let warehouse = await prisma.warehouse.findFirst({
      where: {
        OR: [
          { id: warehouseInput },
          { name: warehouseInput },
          { code: warehouseInput },
        ],
      },
    });
    if (!warehouse) {
      warehouse = await prisma.warehouse.findFirst({
        where: {
          OR: [
            { name: { equals: warehouseInput, mode: 'insensitive' } },
            { code: { equals: warehouseInput, mode: 'insensitive' } },
          ],
        },
      });
    }
    if (!warehouse) {
      const available = await prisma.warehouse.findMany({
        select: { id: true, name: true, code: true },
        where : { OR: [{ name: { contains: 'KANDANG', mode: 'insensitive' } }, { code: { contains: 'KD', mode: 'insensitive' } }] },
      });
      return NextResponse.json({
        message             : `Kandang "${warehouseInput}" tidak ditemukan.`,
        availableWarehouses : available,
      }, { status: 404 });
    }

    // ── Parse file ────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    let rows;
    try { rows = parseSpreadsheet(buffer); }
    catch (e) { return NextResponse.json({ message: e.message }, { status: 422 }); }

    const now             = new Date();
    const recordedBy      = session.user.name || session.user.email;
    const sourceFile      = file.name;
    const defaultWeight   = parseFloat(defaultWeightStr) || 450;
    const hargaBeliPerKg  = hargaBeliPerKgStr ? parseFloat(hargaBeliPerKgStr) : null;

    let created = 0;
    let updated = 0;

    const BATCH = 50;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);

      await prisma.$transaction(async (tx) => {
        for (const { rfid, weight: fileWeight } of batch) {
          const finalWeight  = fileWeight > 0 ? fileWeight : defaultWeight;

          // weightBeli: bisa dari override, dari file, atau default
          const weightBeli   = weightBeliOverride
            ? parseFloat(weightBeliOverride)
            : finalWeight;

          // Kalkulasi harga beli total jika hargaBeliPerKg tersedia
          const hargaBeliTotal = hargaBeliPerKg && weightBeli
            ? parseFloat((hargaBeliPerKg * weightBeli).toFixed(2))
            : null;

          const existing = await tx.cattle.findUnique({
            where : { id: rfid },
            select: { id: true, weightTerima: true },
          });

          // Kalkulasi susut jika sudah ada weightTerima
          const susutPct = existing?.weightTerima && weightBeli
            ? parseFloat(((weightBeli - existing.weightTerima) / weightBeli * 100).toFixed(2))
            : null;

          const baseData = {
            weight          : finalWeight,       // bobot terima (dari scan)
            status          : 'IN_KANDANG',
            lastWeightDate  : now,
            lastScanAt      : now,
            warehouseId     : warehouse.id,
            arrivalId       : arrivalId || undefined,
            // Field HPP & Bobot v2
            weightBeli      : weightBeli,
            weightTerima    : finalWeight,
            ...(susutPct    != null ? { susutPct } : {}),
            ...(hargaBeliPerKg   ? { hargaBeliPerKg }  : {}),
            ...(hargaBeliTotal   ? { hargaBeliTotal }   : {}),
            ...(hargaBeliTotal   ? { hppPerEkor: hargaBeliTotal } : {}),
            weightHistory: {
              create: {
                weight    : finalWeight,
                recordedAt: now,
                recordedBy,
                note,
                sourceFile,
              },
            },
          };

          if (existing) {
            await tx.cattle.update({ where: { id: rfid }, data: baseData });
            updated++;
          } else {
            await tx.cattle.create({
              data: { id: rfid, rfidNo: rfid, ...baseData },
            });
            created++;
          }
        }
      });
    }

    return NextResponse.json({
      message      : `✅ Berhasil memproses ${rows.length} ekor ke kandang ${warehouse.name}.`,
      total        : rows.length,
      created,
      updated,
      warehouseId  : warehouse.id,
      warehouseName: warehouse.name,
      hargaBeliPerKgApplied: hargaBeliPerKg ?? null,
    });

  } catch (err) {
    console.error('IMPORT_RFID_V2_ERROR:', err);
    return NextResponse.json({ message: 'Kesalahan server: ' + err.message }, { status: 500 });
  }
}

// ─── GET ─────────────────────────────────────────────────────
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');
    const status      = searchParams.get('status');

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (status)      where.status      = status;

    const cattle = await prisma.cattle.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        warehouse    : { select: { id: true, name: true, code: true } },
        weightHistory: { orderBy: { recordedAt: 'desc' }, take: 3 },
        // Sertakan field baru untuk badge di CattleDetailModal
        // (Prisma akan select semua scalar field otomatis)
      },
      // Select hanya field yang diperlukan untuk performa
      // (uncomment jika collection besar)
      // select: { id, rfidNo, weight, weightBeli, weightTerima, weightGrading, weightPanen,
      //           status, healthStatus, vaccinated, lastVaccineDate, susutPct,
      //           hargaBeliPerKg, hppPerEkor, lastScanAt, lastWeightDate, name,
      //           warehouseId, warehouse, weightHistory }
    });

    return NextResponse.json(cattle);
  } catch (err) {
    console.error('CATTLE_GET_V2:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
