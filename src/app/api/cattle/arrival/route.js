// app/api/cattle/arrival/route.js
//
// POST /api/cattle/arrival - mencatat kedatangan sapi & otomatis buat STTB
// GET  /api/cattle/arrival - list history kedatangan

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Generate nomor arrival
const generateArrivalNo = async (tx) => {
  const now = new Date();
  const prefix = `ARR/${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}/`;
  const last = await tx.cattleArrival.findFirst({
    where: { arrivalNo: { startsWith: prefix } },
    orderBy: { arrivalNo: "desc" },
    select: { arrivalNo: true },
  });
  const seq = last ? parseInt(last.arrivalNo.split("/").pop()) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
};

// Generate STTB No otomatis
const generateSttbNo = async (tx) => {
  const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const prefix = `STTB/${dateStr}/`;
  const count = await tx.sTTB.count({ where: { sttbNo: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
};

// Konstanta susut alert
const SUSUT_ALERT_PCT = 8.5;

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const purchasingId = formData.get("purchasingId");
    const trucksData = JSON.parse(formData.get("trucks") || "[]");
    const photoFile = formData.get("file");
    const rfidFile = formData.get("rfidFile");

    // Form fields
    const form = {
      namaKapal: formData.get("namaKapal") || "",
      noBl: formData.get("noBl") || "",
      namaPBM: formData.get("namaPBM") || "",
      namaMKL: formData.get("namaMKL") || "",
      noSuratJalan: formData.get("noSuratJalan") || "",
      warehouseId: formData.get("warehouseId") || null,
      notes: formData.get("notes") || "",
    };

    if (!purchasingId) {
      return NextResponse.json({ message: "PO ID diperlukan" }, { status: 400 });
    }

    if (!trucksData.length) {
      return NextResponse.json({ message: "Data truk minimal satu" }, { status: 400 });
    }

    // Cek PO
    const po = await prisma.cattlePurchasing.findUnique({
      where: { id: purchasingId },
      include: { items: true },
    });

    if (!po) {
      return NextResponse.json({ message: "PO tidak ditemukan" }, { status: 404 });
    }

    if (po.isReceived) {
      return NextResponse.json({ message: "PO sudah diterima sebelumnya" }, { status: 400 });
    }

    if (po.status !== "APPROVED") {
      return NextResponse.json({ message: "PO harus sudah APPROVED" }, { status: 400 });
    }

    // Hitung agregat dari truk
    let totalHeadArrived = 0;
    let grossTotal = 0;
    let tareTotal = 0;
    let netTotal = 0;
    const truckDetails = [];

    for (const truck of trucksData) {
      const head = parseInt(truck.headCount) || 0;
      const gross = parseFloat(truck.grossWeight) || 0;
      const tare = parseFloat(truck.tareWeight) || 0;
      const net = Math.max(0, gross - tare);

      totalHeadArrived += head;
      grossTotal += gross;
      tareTotal += tare;
      netTotal += net;

      truckDetails.push({
        noTruk: truck.noTruk,
        headCount: head,
        grossWeight: gross,
        tareWeight: tare,
        netWeight: net,
        avgWeight: head > 0 ? net / head : 0,
        notes: truck.notes || "",
      });
    }

    // Hitung rata-rata
    const avgReceived = totalHeadArrived > 0 ? netTotal / totalHeadArrived : 0;
    const avgPurchase = po.totalHeadOrdered > 0 ? po.totalWeightKg / po.totalHeadOrdered : 0;
    
    // Hitung susut
    const susutKg = Math.max(0, avgPurchase - avgReceived);
    const susutPct = avgPurchase > 0 ? (susutKg / avgPurchase) * 100 : 0;
    const susutAlert = susutPct > SUSUT_ALERT_PCT;

    // Upload photo
    let imageUrl = null;
    if (photoFile && typeof photoFile !== "string" && photoFile.size > 0) {
      const { writeFile, mkdir } = await import("fs/promises");
      const path = await import("path");
      const dir = path.join(process.cwd(), "public", "uploads", "cattle-arrival");
      await mkdir(dir, { recursive: true }).catch(() => {});
      const fileName = `${Date.now()}-${photoFile.name.replace(/\s+/g, "_")}`;
      const bytes = await photoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(path.join(dir, fileName), buffer);
      imageUrl = `/uploads/cattle-arrival/${fileName}`;
    }

    const userName = session.user.name || session.user.email;
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat CattleArrival (menggunakan field sesuai schema terbaru)
      const arrivalNo = await generateArrivalNo(tx);
      const arrival = await tx.cattleArrival.create({
        data: {
          arrivalNo,
          purchasingId,
          warehouseId: form.warehouseId,
          namaKapal: form.namaKapal || null,
          noBl: form.noBl || null,
          namaPBM: form.namaPBM || null,
          namaMKL: form.namaMKL || null,
          noSuratJalan: form.noSuratJalan || null,
          vehicleNo: truckDetails.map(t => t.noTruk).join(", "),
          imageUrl,
          rfidFileUrl: rfidFile?.name || null,
          rfidImported: !!rfidFile,
          rfidCount: totalHeadArrived,
          totalHeadArrived,
          grossWeightTotal: grossTotal,
          tareWeightTotal: tareTotal,
          netWeightTotal: netTotal,
          avgWeightReceived: avgReceived,
          avgWeightPurchase: avgPurchase,
          susutKg,
          susutPct,
          susutAlert,
          condition: "GOOD",
          receivedBy: userName,
          notes: JSON.stringify({ trucks: truckDetails, originalNotes: form.notes }),
          status: "COMPLETED",
        },
      });

      // 2. Update PO menjadi RECEIVED
      await tx.cattlePurchasing.update({
        where: { id: purchasingId },
        data: {
          isReceived: true,
          status: "RECEIVED",
        },
      });

      // 3. BUAT STTB OTOMATIS
      const sttbNo = await generateSttbNo(tx);
      const sttb = await tx.sTTB.create({
        data: {
          sttbNo,
          isCattle: true,
          cattlePOId: purchasingId,
          cattleArrivalId: arrival.id,
          jumlahEkor: totalHeadArrived,
          beratHidupTotal: netTotal,
          beratHidupRata: avgReceived,
          beratBeli: avgPurchase,
          susutKg,
          susutPct,
          susutAlert,
          status: "PENDING_QC",
          qcApprovedBy: userName,
          qcApprovedAt: now,
          qcNotes: `Auto-QC dari Arrival: ${totalHeadArrived} ekor, ${netTotal.toFixed(1)} kg, Susut: ${susutPct.toFixed(1)}%`,
          warehouseId: form.warehouseId,
        },
      });

      // 4. Buat CattleBatch (stok awal) - menggunakan field schema terbaru
      const batchNo = `CB/${now.toISOString().slice(0, 10).replace(/-/g, "")}/${String(await tx.cattleBatch.count() + 1).padStart(4, "0")}`;
      
      await tx.cattleBatch.create({
        data: {
          batchNo,
          purchasingId,
          warehouseId: form.warehouseId,
          vendorName: po.vendorName,
          noPO: po.noPO,
          headInitial: totalHeadArrived,
          headRemaining: totalHeadArrived,
          avgWeightReceived: avgReceived,
          avgWeightCurrent: avgReceived,
          totalWeightCurrent: netTotal,
          hppAwalPerEkor: po.hppPerEkor,
          hppKumulatifPerEkor: po.hppPerEkor,
          totalHppKumulatif: po.hppPerEkor * totalHeadArrived,
          priceUSD: po.pricePerHeadUSD || 0,
          exchangeRate: po.exchangeRate || 0,
          status: "ACTIVE",
          arrivedAt: now,
        },
      });

      // 5. History
      await tx.history.create({
        data: {
          action: "CATTLE_ARRIVAL_WITH_STTB",
          item: `${totalHeadArrived} ekor - ${po.vendorName}`,
          category: "Cattle",
          type: "LIVESTOCK",
          quantity: totalHeadArrived,
          unit: "EKOR",
          user: userName,
          referenceId: arrival.id,
          notes: `Arrival ${arrivalNo} | STTB ${sttbNo} otomatis | Susut: ${susutPct.toFixed(1)}%${susutAlert ? " ⚠" : ""}`,
        },
      });

      return { arrival, sttb };
    });

    return NextResponse.json({
      message: `Kedatangan ${totalHeadArrived} ekor sapi berhasil dicatat.\nSTTB ${result.sttb.sttbNo} otomatis dibuat dan menunggu approval.\nSusut: ${susutPct.toFixed(1)}%${susutAlert ? " ⚠" : ""}`,
      data: {
        arrival: result.arrival,
        sttb: result.sttb,
      },
    }, { status: 201 });

  } catch (error) {
    console.error("CATTLE_ARRIVAL_POST_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// GET - list history arrivals
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const arrivals = await prisma.cattleArrival.findMany({
      include: {
        po: {
          select: {
            noPO: true,
            vendorName: true,
            totalHeadOrdered: true,
            totalWeightKg: true,
            hppPerEkor: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Parse notes JSON untuk frontend
    const formatted = arrivals.map(arrival => {
      let parsedNotes = {};
      try {
        parsedNotes = JSON.parse(arrival.notes || "{}");
      } catch (e) {}

      return {
        ...arrival,
        trucks: parsedNotes.trucks || [],
        rfidImported: arrival.rfidImported,
        rfidCount: arrival.rfidCount,
        namaKapal: arrival.namaKapal,
        noBl: arrival.noBl,
        namaPBM: arrival.namaPBM,
        namaMKL: arrival.namaMKL,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("CATTLE_ARRIVAL_GET_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}