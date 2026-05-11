// app/api/cattle/purchasing/route.js
//
// GET    /api/cattle/purchasing?status=xxx     — list semua PO sapi
// POST   /api/cattle/purchasing                — buat PO baru (langsung atau dari DO)

import { NextResponse }    from "next/server";
import prisma              from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions }     from "@/app/api/auth/[...nextauth]/route";

// ─── Auto-number PO ───────────────────────────────────────────────────────────
const generateNoPO = async (tx) => {
  const now    = new Date();
  const prefix = `CPO/${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,"0")}/`;
  const last   = await tx.cattlePurchasing.findFirst({
    where: { noPO: { startsWith: prefix } },
    orderBy: { noPO: "desc" },
    select: { noPO: true },
  });
  const seq = last ? parseInt(last.noPO.split("/").pop()) + 1 : 1;
  return `${prefix}${String(seq).padStart(3,"0")}`;
};

// ─── Kalkulasi HPP ─────────────────────────────────────────────────────────────
const calcHpp = ({
  pricePerKgIDR=0, totalWeightKg=0,
  biayaBongkar=0, biayaTracking=0, biayaKarantina=0, biayaLainLain=0,
  totalHeadOrdered=0,
}) => {
  const totalBiayaPerKg = totalWeightKg > 0
    ? (parseFloat(biayaBongkar) + parseFloat(biayaTracking) + parseFloat(biayaKarantina) + parseFloat(biayaLainLain)) / parseFloat(totalWeightKg)
    : 0;
  const hppPerKg   = parseFloat(pricePerKgIDR) + totalBiayaPerKg;
  const hppPerEkor = totalHeadOrdered > 0 ? (hppPerKg * parseFloat(totalWeightKg)) / parseFloat(totalHeadOrdered) : 0;
  const hppTotal   = hppPerEkor * parseFloat(totalHeadOrdered);
  return { hppPerKg: parseFloat(hppPerKg.toFixed(2)), hppPerEkor: parseFloat(hppPerEkor.toFixed(2)), hppTotal: parseFloat(hppTotal.toFixed(2)) };
};

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const isReceived = searchParams.get("isReceived");

    const where = {};
    if (status) where.status = status;
    if (isReceived !== null) where.isReceived = isReceived === 'true';

    const orders = await prisma.cattlePurchasing.findMany({
      where,
      include: {
        items: {
          include: {
            breed: true,
            doItem: {
              select: { 
                id: true,
                jenisSapi: true, 
                gender: true,
                headRequired: true,
                weightRequiredKg: true,
              }
            }
          }
        },
        warehouse: { select: { id: true, name: true, code: true } },
        arrivals: {
          select: {
            id: true,
            arrivalNo: true,
            totalHeadArrived: true,
            netWeightTotal: true,
            avgWeightReceived: true,
            susutPct: true,
            susutAlert: true,
            // HAPUS: receivedAt tidak ada di schema, gunakan createdAt
            createdAt: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
        },
        batches: {
          select: {
            id: true,
            batchNo: true,
            headRemaining: true,
            status: true,
            arrivedAt: true,
          }
        },
        sttbs: {
          where: { isCattle: true },
          select: {
            id: true,
            sttbNo: true,
            status: true,
            susutPct: true,
            susutAlert: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform data untuk kebutuhan frontend
    const transformedOrders = orders.map(order => {
      // Hitung total head yang sudah diterima dari arrivals
      const totalHeadReceived = order.arrivals?.reduce((sum, a) => sum + (a.totalHeadArrived || 0), 0) || 0;
      // Gunakan netWeightTotal untuk total berat yang diterima
      const totalWeightReceived = order.arrivals?.reduce((sum, a) => sum + (a.netWeightTotal || 0), 0) || 0;
      
      // Hitung rata-rata berat per ekor dari PO
      const avgWeightKg = order.totalHeadOrdered > 0 
        ? (order.totalWeightKg / order.totalHeadOrdered).toFixed(1) 
        : 0;
      
      // Cek apakah PO sudah fully received
      const isFullyReceived = totalHeadReceived >= order.totalHeadOrdered;
      
      // Ambil STTB terbaru
      const latestSttb = order.sttbs?.[0];

      return {
        ...order,
        // Field untuk ArrivalModal / frontend
        avgWeightKg: parseFloat(avgWeightKg),
        headCount: order.totalHeadOrdered,
        hppAwalPerEkor: order.hppPerEkor,
        totalHeadReceived,
        totalWeightReceived,
        isFullyReceived,
        // Status untuk frontend
        canReceive: order.status === 'APPROVED' && !order.isReceived && !isFullyReceived,
        canCreateSttb: order.status === 'APPROVED' && !order.isReceived && !latestSttb,
        // STTB Info
        latestSttb,
        // Ambil data item pertama untuk preview (jika ada)
        firstItem: order.items?.[0] ? {
          id: order.items[0].id,
          jenisSapi: order.items[0].jenisSapi,
          gender: order.items[0].gender,
          breedId: order.items[0].breedId,
          breed: order.items[0].breed,
          headOrdered: order.items[0].headOrdered,
          weightKg: order.items[0].weightKg,
          pricePerKg: order.items[0].pricePerKg,
        } : null,
      };
    });

    return NextResponse.json(transformedOrders);
  } catch (err) {
    console.error("CATTLE_PO_GET:", err.message);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      vendorName, vendorCountry = "Australia", vendorEksportir,
      pricePerKgIDR = 0,
      pricePerHeadUSD = 0,
      exchangeRate = 0,
      biayaBongkar = 0, biayaTracking = 0, biayaKarantina = 0, biayaLainLain = 0,
      warehouseId, notes,
      items = [],
    } = body;

    if (!vendorName) return NextResponse.json({ message: "Nama vendor wajib diisi." }, { status: 400 });
    if (!items.length) return NextResponse.json({ message: "Minimal satu jenis sapi harus diisi." }, { status: 400 });

    // Validasi items
    for (const it of items) {
      if (!it.jenisSapi) return NextResponse.json({ message: "Jenis sapi wajib diisi." }, { status: 400 });
      if (!(parseInt(it.headOrdered) > 0)) return NextResponse.json({ message: `Jumlah ekor "${it.jenisSapi}" harus > 0.` }, { status: 400 });
      if (!(parseFloat(it.weightKg) > 0)) return NextResponse.json({ message: `Total bobot "${it.jenisSapi}" harus > 0.` }, { status: 400 });
      if (!(parseFloat(it.pricePerKg) > 0)) return NextResponse.json({ message: `Harga/kg "${it.jenisSapi}" harus > 0.` }, { status: 400 });
    }

    // Hitung agregat
    const totalHeadOrdered = items.reduce((s, i) => s + (parseInt(i.headOrdered)||0), 0);
    const totalWeightKg    = items.reduce((s, i) => s + (parseFloat(i.weightKg)||0), 0);
    const totalEstimasi    = items.reduce((s, i) => s + (parseFloat(i.weightKg)||0) * (parseFloat(i.pricePerKg)||0), 0);

    const effPricePerKg = pricePerKgIDR || (totalWeightKg > 0 ? totalEstimasi / totalWeightKg : 0);
    const hpp = calcHpp({ 
      pricePerKgIDR: effPricePerKg, 
      totalWeightKg, 
      biayaBongkar, 
      biayaTracking, 
      biayaKarantina, 
      biayaLainLain, 
      totalHeadOrdered 
    });

    const result = await prisma.$transaction(async (tx) => {
      const noPO = await generateNoPO(tx);

      const po = await tx.cattlePurchasing.create({
        data: {
          noPO,
          vendorName,
          vendorCountry,
          vendorEksportir: vendorEksportir || null,
          pricePerKgIDR:   effPricePerKg,
          pricePerHeadUSD: parseFloat(pricePerHeadUSD),
          exchangeRate:    parseFloat(exchangeRate),
          biayaBongkar:    parseFloat(biayaBongkar),
          biayaTracking:   parseFloat(biayaTracking),
          biayaKarantina:  parseFloat(biayaKarantina),
          biayaLainLain:   parseFloat(biayaLainLain),
          totalHeadOrdered,
          totalWeightKg,
          hppPerKg:        hpp.hppPerKg,
          hppPerEkor:      hpp.hppPerEkor,
          hppTotal:        hpp.hppTotal,
          totalEstimasi,
          requestedBy:     session.user.name || session.user.email,
          status:          "PENDING",
          warehouseId:     warehouseId || null,
          notes:           notes || null,
        },
      });

      // Buat items
      for (const it of items) {
        const headO  = parseInt(it.headOrdered) || 0;
        const wt     = parseFloat(it.weightKg)  || 0;
        const pKg    = parseFloat(it.pricePerKg) || 0;
        const avgWt  = headO > 0 ? wt / headO : 0;

        await tx.cattlePOItem.create({
          data: {
            purchasingId:   po.id,
            jenisSapi:      it.jenisSapi.toUpperCase(),
            gender:         it.gender  || "CAMPUR",
            headOrdered:    headO,
            weightKg:       wt,
            avgWeightKg:    avgWt,
            pricePerKg:     pKg,
            totalHarga:     wt * pKg,
            pricePerHeadUSD: parseFloat(it.pricePerHeadUSD) || 0,
            doItemId:       it.doItemId || null,
            breedId:        it.breedId  || null,
            notes:          it.notes    || null,
          },
        });

        // Update DOItem.headOrdered & weightOrderedKg jika ada link
        if (it.doItemId) {
          await tx.cattleDOItem.update({
            where: { id: it.doItemId },
            data: {
              headOrdered:    { increment: headO },
              weightOrderedKg: { increment: wt },
            },
          });
          
          // Update DO status
          const doItem = await tx.cattleDOItem.findUnique({ 
            where: { id: it.doItemId }, 
            select: { deliveryOrderId: true } 
          });
          
          if (doItem) {
            const allItems = await tx.cattleDOItem.findMany({ 
              where: { deliveryOrderId: doItem.deliveryOrderId } 
            });
            const allFulfilled = allItems.every(i => i.headOrdered >= i.headRequired);
            const anyOrdered   = allItems.some(i => i.headOrdered > 0);
            await tx.cattleDeliveryOrder.update({
              where: { id: doItem.deliveryOrderId },
              data:  { status: allFulfilled ? "FULFILLED" : anyOrdered ? "PARTIAL" : "APPROVED" },
            });
          }
        }
      }

      // History
      await tx.history.create({
        data: {
          action:      "CATTLE_PO_CREATED",
          item:        `${totalHeadOrdered} ekor - ${vendorName}`,
          category:    "Cattle",
          type:        "LIVESTOCK",
          quantity:    totalHeadOrdered,
          unit:        "EKOR",
          user:        session.user.name || "System",
          referenceId: po.id,
          notes: `PO ${noPO} | ${totalWeightKg.toLocaleString("id-ID")} kg | HPP/kg: Rp ${hpp.hppPerKg.toLocaleString("id-ID")}`,
        },
      });

      return po;
    });

    return NextResponse.json({
      message: `PO ${result.noPO} berhasil dibuat. ${totalHeadOrdered} ekor / ${totalWeightKg.toLocaleString("id-ID")} kg.`,
      data: result,
    }, { status: 201 });

  } catch (err) {
    console.error("CATTLE_PO_POST:", err.message);
    if (err.code === "P2002") return NextResponse.json({ message: "Nomor PO duplikat. Coba lagi." }, { status: 409 });
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}