// /app/api/cattle/import-rfid/route.js  — v3
// POST  — Two-step import:
//   Step 1 (isPreview=true): Parse file → return rfidList + sessionId (in-memory, 30 min TTL)
//   Step 2 (sessionId + weights[]): Batch create/update Cattle with per-ekor weight
// GET   — Daftar Cattle per Warehouse
// ============================================================

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';
import * as XLSX            from 'xlsx';
import { randomUUID }       from 'crypto';

const ALLOWED = ['SuperAdmin', 'Admin', 'Supervisor', 'Staff'];

// ── In-memory session store (auto-purge after TTL) ───────────
// Map<sessionId, { rfidList, warehouseId, createdAt }>
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 menit
const importSessions = new Map();

function purgeExpiredSessions() {
  const now = Date.now();
  for (const [id, s] of importSessions) {
    if (now - s.createdAt > SESSION_TTL_MS) importSessions.delete(id);
  }
}

// ── Parser spreadsheet ────────────────────────────────────────
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

  // Cari kolom eartagNo jika ada
  const eartagColIndex = headerRow.findIndex((c) => c && /eartag|ear.?tag|tag.?no|tag.?num/i.test(String(c)));

  const rfids = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const eid = row[eidColIndex];
    if (!eid) continue;

    const eidStr = String(eid).trim();
    if (['GROUP SEPARATOR', 'EID'].includes(eidStr)) continue;
    if (eidStr.toLowerCase().includes('sli')) continue;

    const cleanRfid = eidStr.replace(/\s+/g, '');
    if (!/^\d+$/.test(cleanRfid)) continue;

    const eartagNo = eartagColIndex !== -1 && row[eartagColIndex]
      ? String(row[eartagColIndex]).trim()
      : null;

    rfids.push({ rfidNo: cleanRfid, eartagNo, rowIndex: i + 1 });
  }

  if (!rfids.length) throw new Error('Tidak ada data RFID valid dalam file.');

  return rfids;
}

// ─── POST ─────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED.includes(session.user?.role))
      return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

    const contentType = req.headers.get('content-type') || '';

    // ════════════════════════════════════════════════════════════
    // STEP 2: Save with per-ekor weights (JSON body)
    // ════════════════════════════════════════════════════════════
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { sessionId, warehouseId: whId, note, weights } = body;

      if (!sessionId)  return NextResponse.json({ message: 'sessionId wajib diisi.' }, { status: 400 });
      if (!weights?.length) return NextResponse.json({ message: 'Data berat kosong.' }, { status: 400 });

      purgeExpiredSessions();
      const sess = importSessions.get(sessionId);
      if (!sess) return NextResponse.json({
        message: 'Session tidak ditemukan atau sudah kadaluarsa (30 menit). Silakan upload ulang.',
      }, { status: 404 });

      // Validasi warehouseId
      const warehouseId = whId || sess.warehouseId;
      const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
      if (!warehouse) return NextResponse.json({ message: 'Kandang tidak ditemukan.' }, { status: 404 });

      // Buat lookup rfidNo → weight + notes + eartagNo dari payload
      const weightMap = new Map();
      for (const w of weights) {
        const wt = parseFloat(w.weight);
        if (isNaN(wt) || wt <= 0 || wt > 1500)
          return NextResponse.json({
            message: `Berat tidak valid untuk RFID ${w.rfidNo}: ${w.weight}. Harus antara 0.1–1500 kg.`,
          }, { status: 422 });
        weightMap.set(String(w.rfidNo), {
          weight  : wt,
          notes   : w.notes   || '',
          eartagNo: w.eartagNo ? String(w.eartagNo).trim() : null,
        });
      }

      const now        = new Date();
      const recordedBy = session.user.name || session.user.email;
      const batchNote  = note || `Import RFID ${new Date().toLocaleDateString('id-ID')}`;

      let created = 0, updated = 0;
      const errors = [];

      const BATCH = 50;
      const rfidList = sess.rfidList;

      for (let i = 0; i < rfidList.length; i += BATCH) {
        const chunk = rfidList.slice(i, i + BATCH);

        await prisma.$transaction(async (tx) => {
          for (const { rfidNo, eartagNo } of chunk) {
            const entry = weightMap.get(rfidNo);
            if (!entry) {
              errors.push({ rfidNo, reason: 'Tidak ada data berat dikirim.' });
              continue;
            }

            const { weight, notes, eartagNo: payloadEartag } = entry;
            // eartagNo: pakai dari payload (user input) jika ada, fallback ke file
            const resolvedEartag = payloadEartag || eartagNo || null;
            const cattleNote = [batchNote, notes].filter(Boolean).join(' · ');

            const existing = await tx.cattle.findUnique({
              where : { id: rfidNo },
              select: { id: true },
            });

            const baseData = {
              weight         : weight,
              weightBeli     : weight,
              weightTerima   : weight,
              status         : 'IN_KANDANG',
              lastWeightDate : now,
              lastScanAt     : now,
              warehouseId    : warehouse.id,
              ...(resolvedEartag ? { name: resolvedEartag } : {}),
              weightHistory: {
                create: {
                  weight    : weight,
                  recordedAt: now,
                  recordedBy,
                  note      : cattleNote,
                  sourceFile: sess.fileName || 'import-rfid',
                },
              },
            };

            try {
              if (existing) {
                await tx.cattle.update({ where: { id: rfidNo }, data: baseData });
                updated++;
              } else {
                await tx.cattle.create({
                  data: { id: rfidNo, rfidNo, ...baseData },
                });
                created++;
              }
            } catch (e) {
              errors.push({ rfidNo, reason: e.message });
            }
          }
        });
      }

      // Hapus session setelah berhasil diproses
      importSessions.delete(sessionId);

      return NextResponse.json({
        success      : true,
        message      : `✅ Berhasil memproses ${created + updated} ekor ke kandang ${warehouse.name}.`,
        total        : rfidList.length,
        created,
        updated,
        errors,
        warehouseId  : warehouse.id,
        warehouseName: warehouse.name,
      });
    }

    // ════════════════════════════════════════════════════════════
    // STEP 1: Preview / Parse file (FormData)
    // ════════════════════════════════════════════════════════════
    const formData = await req.formData();

    const file           = formData.get('file');
    const warehouseInput = formData.get('warehouseId');
    const isPreview      = formData.get('isPreview') === 'true';

    if (!file) return NextResponse.json({ message: 'File tidak ditemukan.' }, { status: 400 });
    if (!warehouseInput) return NextResponse.json({ message: 'Kandang tujuan wajib dipilih.' }, { status: 400 });

    // Validasi/cari warehouse
    let warehouse = await prisma.warehouse.findFirst({
      where: {
        OR: [
          { id: warehouseInput },
          { name: { equals: warehouseInput, mode: 'insensitive' } },
          { code: { equals: warehouseInput, mode: 'insensitive' } },
        ],
      },
    });
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

    const buffer = Buffer.from(await file.arrayBuffer());
    let rfidList;
    try { rfidList = parseSpreadsheet(buffer); }
    catch (e) { return NextResponse.json({ message: e.message }, { status: 422 }); }

    // Jika hanya preview → simpan session, kembalikan rfidList
    if (isPreview) {
      purgeExpiredSessions();
      const sessionId = randomUUID();
      importSessions.set(sessionId, {
        rfidList,
        warehouseId: warehouse.id,
        fileName   : file.name,
        createdAt  : Date.now(),
      });

      return NextResponse.json({
        success    : true,
        sessionId,
        total      : rfidList.length,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        rfidList,
      });
    }

    // Fallback: jika isPreview tidak dikirim, kembalikan hanya preview data
    // (backward-compat: tidak langsung save)
    return NextResponse.json({
      success   : false,
      message   : 'Gunakan isPreview=true untuk step 1, lalu kirim JSON dengan sessionId + weights untuk step 2.',
    }, { status: 400 });

  } catch (err) {
    console.error('IMPORT_RFID_V3_ERROR:', err);
    return NextResponse.json({ message: 'Kesalahan server: ' + err.message }, { status: 500 });
  }
}

// ─── GET ──────────────────────────────────────────────────────
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
      },
    });

    return NextResponse.json(cattle);
  } catch (err) {
    console.error('CATTLE_GET_V3:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── DELETE — cleanup session manual (opsional) ───────────────
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    if (sessionId) importSessions.delete(sessionId);
    purgeExpiredSessions();
    return NextResponse.json({ success: true, activeSessions: importSessions.size });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
