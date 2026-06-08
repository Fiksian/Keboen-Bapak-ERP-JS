// /app/api/cattle/[id]/medication/route.js
// POST — Tambah vaksin / obat, update vaccinated + lastMedicationDate di Cattle
// GET  — List riwayat medikasi + deteksi vaksin yang jatuh tempo
// ============================================================

import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/app/api/auth/[...nextauth]/route';
import prisma               from '@/lib/prisma';

const ALLOWED = ['SuperAdmin', 'Admin', 'Supervisor', 'Staff'];

// ─── Master list produk (vaksin + obat) ──────────────────────────────────────
export const MEDICATION_PRODUCTS = [
  // Vaksin
  { name: 'Vaksin LSD',  type: 'VAKSIN', defaultUnit: 'dosis' },
  { name: 'Vaksin PMK',  type: 'VAKSIN', defaultUnit: 'dosis' },
  { name: 'Vaksin SE',   type: 'VAKSIN', defaultUnit: 'dosis' },
  // Obat & suplemen
  { name: 'Adepros',             type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Banixin',             type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Bio Energi',          type: 'OBAT', defaultUnit: 'sachet' },
  { name: 'Biodin',              type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Canimag 500ml',       type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Catosal',             type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Dexapros Inject',     type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Enroflox LA',         type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Hematodin',           type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Hemostop K',          type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Imidox',              type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Implant Synovex Plus',type: 'OBAT', defaultUnit: 'implant' },
  { name: 'Intermectin',         type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Intracin',            type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Introvit B',          type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Introvit Plus',       type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Limoxin LA',          type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Limoxin Spray',       type: 'OBAT', defaultUnit: 'semprot' },
  { name: 'Lutalyse',            type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Luteosyl',            type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Macrolan',            type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Nacl 500ml',          type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Neo Kotrimok',        type: 'OBAT', defaultUnit: 'tablet' },
  { name: 'Paragin',             type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Procaben',            type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Prodyl',              type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Proxyvet LA',         type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Straw Semen Angus',         type: 'OBAT', defaultUnit: 'straw' },
  { name: 'Straw Semen Belgian Blue',  type: 'OBAT', defaultUnit: 'straw' },
  { name: 'Straw Semen Brahman',       type: 'OBAT', defaultUnit: 'straw' },
  { name: 'Straw Semen Brangus',       type: 'OBAT', defaultUnit: 'straw' },
  { name: 'Straw Semen Simental',      type: 'OBAT', defaultUnit: 'straw' },
  { name: 'Sulprodon',           type: 'OBAT', defaultUnit: 'ml' },
  { name: 'TM VITA',             type: 'OBAT', defaultUnit: 'sachet' },
  { name: 'Tolfen',              type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Tylocare',            type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Tympanol',            type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Vigantol',            type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Vitol-140',           type: 'OBAT', defaultUnit: 'ml' },
  { name: 'V-Tropin',            type: 'OBAT', defaultUnit: 'ml' },
  { name: 'Wormectin Plus',      type: 'OBAT', defaultUnit: 'ml' },
];

// ─── POST ────────────────────────────────────────────────────────────────────
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !ALLOWED.includes(session.user?.role))
    return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });

  try {
    const { id } = await params;
    if (!id)
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });

    const {
      medicationType,  // 'VAKSIN' | 'OBAT'
      productName,
      vaccineType,     // opsional, untuk backward compat
      givenDate,
      doseNumber,
      nextDueDate,
      quantity,
      unit,
      indication,
      administeredBy,
      batchNo,
      note,
    } = await req.json();

    // Validasi wajib
    if (!productName?.trim())
      return NextResponse.json({ message: 'Nama produk wajib diisi.' }, { status: 400 });
    if (!givenDate)
      return NextResponse.json({ message: 'Tanggal pemberian wajib diisi.' }, { status: 400 });

    const parsedDate = new Date(givenDate);
    if (isNaN(parsedDate.getTime()))
      return NextResponse.json({ message: 'Format tanggal tidak valid.' }, { status: 400 });

    const type = medicationType || 'VAKSIN';
    const isVaccine = type === 'VAKSIN';

    await prisma.$transaction([
      prisma.cattleMedication.create({
        data: {
          cattleId      : id,
          medicationType: type,
          productName   : productName.trim(),
          vaccineType   : vaccineType?.trim() || (isVaccine ? productName.trim() : null),
          givenDate     : parsedDate,
          doseNumber    : isVaccine ? (parseInt(doseNumber) || 1) : 1,
          nextDueDate   : isVaccine && nextDueDate ? new Date(nextDueDate) : null,
          quantity      : parseFloat(quantity) || 1,
          unit          : unit?.trim() || (isVaccine ? 'dosis' : 'ml'),
          indication    : indication?.trim() || null,
          administeredBy: administeredBy?.trim() || session.user.name || session.user.email,
          batchNo       : batchNo?.trim() || null,
          note          : note?.trim() || null,
        },
      }),
      prisma.cattle.update({
        where: { id },
        data: {
          ...(isVaccine ? { vaccinated: true, lastVaccineDate: parsedDate } : {}),
          lastMedicationDate: parsedDate,
        },
      }),
    ]);

    const label = isVaccine
      ? `Vaksin ${productName} (Dosis ${doseNumber || 1})`
      : `Obat ${productName}`;

    return NextResponse.json({ message: `${label} berhasil dicatat.` });
  } catch (err) {
    console.error('CATTLE_MEDICATION_POST:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    if (!id)
      return NextResponse.json({ message: 'ID tidak valid' }, { status: 400 });

    const records = await prisma.cattleMedication.findMany({
      where  : { cattleId: id },
      orderBy: { givenDate: 'desc' },
    });

    const now = new Date();

    // Vaksin terlambat (hanya tipe VAKSIN yang punya nextDueDate)
    const overdue = records.filter(
      (v) => v.medicationType === 'VAKSIN' && v.nextDueDate && new Date(v.nextDueDate) < now
    );

    // Vaksin akan jatuh tempo ≤ 30 hari ke depan
    const upcoming = records.filter((v) => {
      if (v.medicationType !== 'VAKSIN' || !v.nextDueDate) return false;
      const due  = new Date(v.nextDueDate);
      const diff = (due - now) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    });

    // Pisah per tipe untuk kemudahan konsumsi FE
    const vaccines = records.filter((r) => r.medicationType === 'VAKSIN');
    const medicines = records.filter((r) => r.medicationType === 'OBAT');

    return NextResponse.json({ records, vaccines, medicines, overdue, upcoming });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}