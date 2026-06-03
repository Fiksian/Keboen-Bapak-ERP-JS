// app/api/cattle/import-rfid/route.js
import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';
import * as XLSX            from 'xlsx';
import { randomUUID }       from 'crypto';

const ALLOWED = ['SuperAdmin', 'Admin', 'Supervisor', 'Staff'];
const SESSION_TTL_MS = 30 * 60 * 1000;
const importSessions = new Map();

function purgeExpiredSessions() {
  const now = Date.now();
  for (const [id, s] of importSessions) {
    if (now - s.createdAt > SESSION_TTL_MS) importSessions.delete(id);
  }
}

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

  const eartagColIndex = headerRow.findIndex(
    (c) => c && /eartag|ear.?tag|tag.?no|tag.?num/i.test(String(c))
  );

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

    const eartagNo =
      eartagColIndex !== -1 && row[eartagColIndex]
        ? String(row[eartagColIndex]).trim()
        : null;

    rfids.push({ rfidNo: cleanRfid, eartagNo, rowIndex: i + 1 });
  }

  if (!rfids.length) throw new Error('Tidak ada data RFID valid dalam file.');
  return rfids;
}

// ─── GET (list cattle) ───────────────────────────────────────────────────────
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');
    const status = searchParams.get('status');
    const purchasingId = searchParams.get('purchasingId');

    const where = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status;
    if (purchasingId) where.purchasingId = purchasingId;

    const cattle = await prisma.cattle.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        weightHistory: { orderBy: { recordedAt: 'desc' }, take: 3 },
        purchasing: { select: { id: true, noPO: true, vendorName: true, hppPerEkor: true } }
      }
    });
    return NextResponse.json(cattle);
  } catch (err) {
    console.error('CATTLE_GET_ERROR:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── POST (import & save) ────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED.includes(session.user?.role))
      return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

    const contentType = req.headers.get('content-type') || '';

    // ════════════════════════════════════════════════════════════
    // STEP 2: Save dengan per-ekor weights + breeds (JSON body)
    // ════════════════════════════════════════════════════════════
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { sessionId, warehouseId: whId, note, weights, forceOverride } = body;

      // Validasi payload baru: setiap weight harus memiliki breed
      if (!sessionId)
        return NextResponse.json({ message: 'sessionId wajib diisi.' }, { status: 400 });
      if (!weights?.length)
        return NextResponse.json({ message: 'Data berat kosong.' }, { status: 400 });

      // Validasi breed per weight
      const missingBreed = weights.filter(w => !w.breed);
      if (missingBreed.length > 0) {
        return NextResponse.json({
          message: `${missingBreed.length} RFID belum dipilih jenis sapi.`,
          missingRfids: missingBreed.map(w => w.rfidNo)
        }, { status: 422 });
      }

      purgeExpiredSessions();
      const sess = importSessions.get(sessionId);
      if (!sess)
        return NextResponse.json(
          { message: 'Session tidak ditemukan atau sudah kadaluarsa (30 menit). Silakan upload ulang.' },
          { status: 404 }
        );

      const warehouseId = whId || sess.warehouseId;
      const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
      if (!warehouse)
        return NextResponse.json({ message: 'Kandang tidak ditemukan.' }, { status: 404 });

      // ── Validasi kuota PO ─────────────────────────────────────
      const purchasingId = sess.purchasingId || null;
      let cattlePO = null;
      let sisaKuota = Infinity;
      let warningMessage = null;

      if (purchasingId) {
        cattlePO = await prisma.cattlePurchasing.findUnique({ where: { id: purchasingId } });
        if (!cattlePO)
          return NextResponse.json({ message: 'PO Sapi tidak ditemukan.' }, { status: 404 });

        sisaKuota = cattlePO.totalHeadOrdered - (cattlePO.headReceived || 0);
        const isPOFull = (cattlePO.headReceived || 0) >= cattlePO.totalHeadOrdered;

        const uniqueRfids = new Set(weights.map(w => String(w.rfidNo)));
        const existing = await prisma.cattle.findMany({
          where: { rfidNo: { in: [...uniqueRfids] } },
          select: { rfidNo: true }
        });
        const existingSet = new Set(existing.map(c => c.rfidNo));
        const newHeadCount = [...uniqueRfids].filter(r => !existingSet.has(r)).length;

        if (newHeadCount > sisaKuota && !forceOverride && sisaKuota >= 0) {
          return NextResponse.json({
            message: `Jumlah sapi baru (${newHeadCount}) melebihi sisa kuota PO ${cattlePO.noPO} (${sisaKuota} ekor). Gunakan "Simpan Paksa" jika tetap ingin melanjutkan.`,
            kuotaTotal: cattlePO.totalHeadOrdered,
            headReceived: cattlePO.headReceived || 0,
            sisaKuota,
            scanned: newHeadCount,
            requiresOverride: true,
          }, { status: 422 });
        }

        if (isPOFull && forceOverride && newHeadCount > 0) {
          warningMessage = `⚠️ PO ${cattlePO.noPO} sudah PENUH (${cattlePO.headReceived}/${cattlePO.totalHeadOrdered}). Menambah ${newHeadCount} ekor melebihi kuota.`;
        }
      }

      // ── Buat weight + breed map ───────────────────────────────
      const dataMap = new Map();
      for (const w of weights) {
        const wt = parseFloat(w.weight);
        if (isNaN(wt) || wt <= 0 || wt > 1500)
          return NextResponse.json({ message: `Berat tidak valid untuk RFID ${w.rfidNo}` }, { status: 422 });
        
        // Validasi breed: harus berupa string non-kosong
        const breed = w.breed?.trim().toUpperCase();
        if (!breed) {
          return NextResponse.json({ message: `Jenis sapi untuk RFID ${w.rfidNo} harus diisi.` }, { status: 422 });
        }

        dataMap.set(String(w.rfidNo), {
          weight: wt,
          breed: breed,
          notes: w.notes || '',
          eartagNo: w.eartagNo ? String(w.eartagNo).trim() : null
        });
      }

      const now = new Date();
      const recordedBy = session.user.name || session.user.email;
      const batchNote = note || `Import RFID ${now.toLocaleDateString('id-ID')}`;
      let created = 0, updated = 0;
      const errors = [];

      // ── Simpan dalam transaction ─────────────────────────────
      await prisma.$transaction(async (tx) => {
        for (const { rfidNo, eartagNo } of sess.rfidList) {
          const entry = dataMap.get(rfidNo);
          if (!entry) {
            errors.push({ rfidNo, reason: 'Tidak ada data berat.' });
            continue;
          }
          const { weight, breed, notes, eartagNo: payloadEartag } = entry;
          const resolvedEartag = payloadEartag || eartagNo || null;
          const cattleNote = [batchNote, notes].filter(Boolean).join(' · ');

          // ✅ Perbaikan: hapus field weightCurrent karena tidak ada di model
          const baseData = {
            weight,
            breed,                                    // ⭐ BARU: simpan jenis sapi
            weightBeli: weight,
            weightTerima: weight,
            // weightCurrent: weight,  // ❌ HAPUS baris ini
            status: 'IN_KANDANG',
            lastWeightDate: now,
            lastScanAt: now,
            warehouseId: warehouse.id,
            ...(purchasingId && { purchasingId }),
            ...(resolvedEartag && { name: resolvedEartag }),
            weightHistory: {
              create: {
                weight,
                recordedAt: now,
                recordedBy,
                note: cattleNote,
                sourceFile: sess.fileName || 'import-rfid'
              }
            }
          };

          const existing = await tx.cattle.findUnique({ where: { id: rfidNo } });
          if (existing) {
            await tx.cattle.update({ where: { id: rfidNo }, data: baseData });
            updated++;
          } else {
            await tx.cattle.create({ data: { id: rfidNo, rfidNo, ...baseData } });
            created++;
          }
        }

        // Update status PO jika ada
        if (purchasingId && cattlePO) {
          const newHeadReceived = (cattlePO.headReceived || 0) + created;
          const isNowFull = newHeadReceived >= cattlePO.totalHeadOrdered;
          
          let newStatus = cattlePO.status;
          if (cattlePO.status !== 'RECEIVED') {
            if (isNowFull) {
              newStatus = 'RECEIVED';
            } else if (newHeadReceived > 0 && newHeadReceived < cattlePO.totalHeadOrdered) {
              newStatus = 'PARTIALLY_RECEIVED';
            }
          }
          
          await tx.cattlePurchasing.update({
            where: { id: purchasingId },
            data: {
              headReceived: newHeadReceived,
              isReceived: isNowFull,
              status: newStatus,
            }
          });
        }
      });

      importSessions.delete(sessionId);
      
      const responseMessage = warningMessage 
        ? `${warningMessage} ✅ ${created} ekor baru, ${updated} ekor update di kandang ${warehouse.name}.`
        : `✅ ${created} ekor baru, ${updated} ekor update di kandang ${warehouse.name}.`;
      
      return NextResponse.json({
        success: true,
        message: responseMessage,
        total: sess.rfidList.length, created, updated, errors,
        warehouseId: warehouse.id, warehouseName: warehouse.name,
        warning: warningMessage,
        ...(cattlePO && {
          po: {
            id: cattlePO.id,
            noPO: cattlePO.noPO,
            headReceived: (cattlePO.headReceived || 0) + created,
            totalHead: cattlePO.totalHeadOrdered,
            status: (cattlePO.headReceived || 0) + created >= cattlePO.totalHeadOrdered ? 'RECEIVED' : 
                    (cattlePO.status === 'RECEIVED' ? 'RECEIVED' : 
                    (created > 0 ? 'PARTIALLY_RECEIVED' : cattlePO.status))
          }
        })
      });
    }

    // ════════════════════════════════════════════════════════════
    // STEP 1: Preview / Parse file (FormData)
    // ════════════════════════════════════════════════════════════
    const formData = await req.formData();
    const file = formData.get('file');
    const warehouseInput = formData.get('warehouseId');
    const isPreview = formData.get('isPreview') === 'true';
    const purchasingIdInput = formData.get('purchasingId') || null;

    if (!file)
      return NextResponse.json({ message: 'File tidak ditemukan.' }, { status: 400 });
    if (!warehouseInput)
      return NextResponse.json({ message: 'Kandang tujuan wajib dipilih.' }, { status: 400 });

    // Validasi warehouse
    let warehouse = await prisma.warehouse.findFirst({
      where: { OR: [{ id: warehouseInput }, { name: warehouseInput }, { code: warehouseInput }] }
    });
    if (!warehouse) {
      const available = await prisma.warehouse.findMany({
        select: { id: true, name: true, code: true },
        where: { OR: [{ name: { contains: 'KANDANG' } }, { code: { contains: 'KD' } }] }
      });
      return NextResponse.json(
        { message: `Kandang "${warehouseInput}" tidak ditemukan.`, availableWarehouses: available },
        { status: 404 }
      );
    }

    // Validasi PO jika diberikan
    let poSummary = null;
    if (purchasingIdInput) {
      const po = await prisma.cattlePurchasing.findUnique({
        where: { id: purchasingIdInput },
        include: { items: true }
      });
      if (!po)
        return NextResponse.json({ message: 'PO Sapi tidak ditemukan.' }, { status: 404 });
      
      if (!['APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED'].includes(po.status))
        return NextResponse.json(
          { message: `PO ${po.noPO} belum berstatus APPROVED, PARTIALLY_RECEIVED atau RECEIVED. Status saat ini: ${po.status}` },
          { status: 400 }
        );

      const sisaKuota = po.totalHeadOrdered - (po.headReceived || 0);
      const isFull = (po.headReceived || 0) >= po.totalHeadOrdered;

      poSummary = {
        id: po.id, noPO: po.noPO, vendorName: po.vendorName,
        totalHead: po.totalHeadOrdered, headReceived: po.headReceived || 0,
        sisaKuota: sisaKuota,
        avgWeightKg: po.totalHeadOrdered > 0 ? po.totalWeightKg / po.totalHeadOrdered : 0,
        hppPerEkor: po.hppPerEkor || 0, 
        status: po.status,
        isFull: isFull,
      };
    }

    // Parse spreadsheet
    const buffer = Buffer.from(await file.arrayBuffer());
    let rfidList;
    try { rfidList = parseSpreadsheet(buffer); }
    catch (e) { return NextResponse.json({ message: e.message }, { status: 422 }); }

    if (isPreview) {
      purgeExpiredSessions();
      const sessionId = randomUUID();
      importSessions.set(sessionId, {
        rfidList, warehouseId: warehouse.id, purchasingId: purchasingIdInput,
        fileName: file.name, createdAt: Date.now()
      });

      const quotaCheck = poSummary ? {
        poHead: poSummary.totalHead,
        received: poSummary.headReceived,
        sisaKuota: poSummary.sisaKuota,
        scanned: rfidList.length,
        selisih: poSummary.sisaKuota - rfidList.length,
        isOver: rfidList.length > poSummary.sisaKuota && poSummary.sisaKuota >= 0,
        isFull: poSummary.isFull,
      } : null;

      return NextResponse.json({
        success: true, sessionId, total: rfidList.length,
        warehouseId: warehouse.id, warehouseName: warehouse.name,
        rfidList, po: poSummary, quotaCheck
      });
    }

    return NextResponse.json(
      { success: false, message: 'Gunakan isPreview=true untuk step 1, lalu kirim JSON dengan sessionId + weights untuk step 2.' },
      { status: 400 }
    );
  } catch (err) {
    console.error('IMPORT_RFID_ERROR:', err);
    return NextResponse.json({ message: 'Kesalahan server: ' + err.message }, { status: 500 });
  }
}

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