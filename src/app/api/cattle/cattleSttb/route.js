// app/api/sttb/route.js
//
// GET  /api/sttb?status=xxx&type=cattle|regular
//   — Jika type=cattle, include cattlePO data
//
// POST /api/sttb  (body: JSON)
//   — Untuk STTB barang biasa: { purchasingId, receiptId } (tetap sama)
//   — Untuk STTB sapi:         { isCattle: true, cattlePOId, jumlahEkor,
//                                beratHidupTotal, suratJalan, vehicleNo,
//                                condition, notes, receivedBy }
//     Kalkulasi susut otomatis: susutKg = beratBeli - beratHidupRata
//     Update CattlePurchasing.isReceived = true setelah STTB dibuat

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ─── Auto-number STTB ────────────────────────────────────────────────────────
const generateSttbNo = async (tx) => {
  const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const prefix  = `STTB/${dateStr}/`;
  const count   = await tx.sTTB.count({ where: { sttbNo: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
};

// ─── Threshold susut sapi ─────────────────────────────────────────────────────
const SUSUT_ALERT_PCT = 8.5;

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type   = searchParams.get("type"); // "cattle" | "regular" | null (all)

    const where = {};
    if (status) where.status = status;
    if (type === "cattle")  where.isCattle = true;
    if (type === "regular") where.isCattle = false;

    const sttbs = await prisma.sTTB.findMany({
      where,
      include: {
        // ── STTB barang biasa ──────────────────────────────────────────────
        receipt: {
          select: {
            id:          true,
            receiptNo:   true,
            suratJalan:  true,
            vehicleNo:   true,
            receivedQty: true,
            grossWeight: true,
            tareWeight:  true,
            refraksi:    true,
            netWeight:   true,
            condition:   true,
            notes:       true,
            receivedBy:  true,
            receivedAt:  true,
            imageUrl:    true,
          },
        },
        purchasing: {
          select: {
            id:       true,
            noPO:     true,
            item:     true,
            qty:      true,
            unit:     true,
            price:    true,
            category: true,
            type:     true,
            supplier: true,
          },
        },
        // ── STTB sapi (nullable) ───────────────────────────────────────────
        cattlePO: {
          select: {
            id:              true,
            noPO:            true,
            vendorName:      true,
            vendorCountry:   true,
            vendorEksportir: true,
            totalHeadOrdered: true,
            totalWeightKg:   true,
            pricePerKgIDR:   true,
            hppPerEkor:      true,
            hppTotal:        true,
            status:          true,
            isReceived:      true,
            items: {
              select: {
                jenisSapi:   true,
                gender:      true,
                headOrdered: true,
                weightKg:    true,
                pricePerKg:  true,
              },
            },
          },
        },
        warehouse: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sttbs);
  } catch (error) {
    console.error("STTB_GET_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userName = session.user.name || session.user.email;

    // ── MODE SAPI ─────────────────────────────────────────────────────────────
    if (body.isCattle) {
      const {
        cattlePOId,
        cattleArrivalId,
        jumlahEkor,
        beratHidupTotal,
        suratJalan,
        vehicleNo,
        condition = "GOOD",
        notes,
        receivedBy,
      } = body;

      if (!cattlePOId) {
        return NextResponse.json({ message: "cattlePOId wajib untuk STTB Sapi." }, { status: 400 });
      }
      if (!jumlahEkor || parseInt(jumlahEkor) <= 0) {
        return NextResponse.json({ message: "Jumlah ekor harus > 0." }, { status: 400 });
      }
      if (!beratHidupTotal || parseFloat(beratHidupTotal) <= 0) {
        return NextResponse.json({ message: "Berat hidup total harus > 0." }, { status: 400 });
      }

      // Ambil data PO sapi
      const cattlePO = await prisma.cattlePurchasing.findUnique({
        where:   { id: cattlePOId },
        include: { items: true },
      });
      if (!cattlePO) {
        return NextResponse.json({ message: "PO Sapi tidak ditemukan." }, { status: 404 });
      }
      if (cattlePO.status !== "APPROVED") {
        return NextResponse.json({ message: "PO Sapi harus berstatus APPROVED sebelum bisa membuat STTB." }, { status: 400 });
      }

      const head           = parseInt(jumlahEkor);
      const beratTotal     = parseFloat(beratHidupTotal);
      const beratRata      = head > 0 ? beratTotal / head : 0;

      // Berat beli rata-rata dari PO (avg weight per ekor)
      const beratBeli      = cattlePO.totalHeadOrdered > 0
        ? cattlePO.totalWeightKg / cattlePO.totalHeadOrdered
        : 0;

      // Hitung susut
      const susutKg        = Math.max(0, beratBeli - beratRata);
      const susutPct       = beratBeli > 0 ? parseFloat(((susutKg / beratBeli) * 100).toFixed(2)) : 0;
      const susutAlert     = susutPct > SUSUT_ALERT_PCT;

      const result = await prisma.$transaction(async (tx) => {
        const sttbNo = await generateSttbNo(tx);

        const sttb = await tx.sTTB.create({
          data: {
            sttbNo,
            // Tidak ada purchasingId / receiptId untuk sapi (null)
            purchasingId:   null,
            receiptId:      null,
            isCattle:       true,
            cattlePOId,
            cattleArrivalId: cattleArrivalId || null,

            // Data timbang sapi
            jumlahEkor:     head,
            beratHidupTotal: beratTotal,
            beratHidupRata:  beratRata,
            beratBeli,
            susutKg,
            susutPct,
            susutAlert,

            // QC auto-approved oleh sistem saat arrival
            status:         "PENDING_QC",
            qcApprovedBy:   userName,
            qcApprovedAt:   new Date(),
            qcNotes:        `Auto-QC: Tiba di kandang. Ekor: ${head}, Berat: ${beratTotal.toFixed(1)} kg, Kondisi: ${condition}`,
          },
        });

        // Update CattlePurchasing → isReceived = true
        await tx.cattlePurchasing.update({
          where: { id: cattlePOId },
          data:  { isReceived: true, status: "RECEIVED" },
        });

        // History
        await tx.history.create({
          data: {
            action:      "CATTLE_STTB_CREATED",
            item:        `${head} ekor - ${cattlePO.vendorName}`,
            category:    "Cattle",
            type:        "LIVESTOCK",
            quantity:    head,
            unit:        "EKOR",
            user:        userName,
            referenceId: sttb.id,
            notes: [
              `STTB ${sttbNo}`,
              `PO: ${cattlePO.noPO}`,
              `${head} ekor / ${beratTotal.toFixed(1)} kg`,
              `Susut: ${susutPct}%${susutAlert ? " ⚠ ALERT" : ""}`,
            ].join(" | "),
          },
        });

        return { sttb, susutPct, susutAlert };
      });

      return NextResponse.json({
        message: [
          `STTB ${result.sttb.sttbNo} berhasil dibuat.`,
          `${head} ekor / ${beratTotal.toFixed(1)} kg.`,
          `Susut: ${susutPct}%${susutAlert ? " ⚠ Melebihi batas 8.5%!" : " (normal)"}`,
        ].join(" "),
        sttb:       result.sttb,
        susutPct,
        susutAlert,
      }, { status: 201 });
    }

    // ── MODE BARANG (tetap sama seperti sebelumnya) ────────────────────────────
    const { purchasingId, receiptId } = body;
    if (!purchasingId || !receiptId) {
      return NextResponse.json({ message: "purchasingId dan receiptId wajib diisi." }, { status: 400 });
    }

    const sttbNo = await generateSttbNo(prisma);
    const sttb   = await prisma.sTTB.create({
      data: {
        sttbNo,
        purchasingId,
        receiptId,
        isCattle:     false,
        status:       "PENDING_QC",
        qcApprovedBy: userName,
        qcApprovedAt: new Date(),
        qcNotes:      "Auto-QC saat penerimaan barang",
      },
    });

    return NextResponse.json({ message: `STTB ${sttbNo} dibuat.`, sttb }, { status: 201 });

  } catch (error) {
    console.error("STTB_POST_ERROR:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ message: "STTB sudah pernah dibuat untuk PO ini." }, { status: 409 });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
