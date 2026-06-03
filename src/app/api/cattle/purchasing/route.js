// app/api/cattle/purchasing/route.js
//
// GET    /api/cattle/purchasing?status=xxx&status2=yyy     — list semua PO sapi
//        Support multiple status: ?status=APPROVED&status=PARTIALLY_RECEIVED
//        atau ?status[]=APPROVED&status[]=PARTIALLY_RECEIVED
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

// ─── Helper untuk parsing status ───────────────────────────────────────────────
const parseStatusParam = (searchParams) => {
  // Coba baca sebagai array (status[])
  const statusArray = searchParams.getAll('status[]');
  if (statusArray.length > 0) {
    return statusArray;
  }
  
  // Coba baca sebagai single value (status)
  const singleStatus = searchParams.get('status');
  if (singleStatus) {
    // Jika mengandung koma, split menjadi array
    if (singleStatus.includes(',')) {
      return singleStatus.split(',').map(s => s.trim());
    }
    return [singleStatus];
  }
  
  return null;
};

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const statusValues = parseStatusParam(searchParams);
    const isReceived = searchParams.get("isReceived");
    const includeFull = searchParams.get("includeFull") === 'true';

    const where = {};
    
    if (statusValues && statusValues.length > 0) {
      const validStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'];
      const filteredStatuses = statusValues.filter(s => validStatuses.includes(s));
      
      if (filteredStatuses.length === 1) {
        where.status = filteredStatuses[0];
      } else if (filteredStatuses.length > 1) {
        where.status = { in: filteredStatuses };
      }
    }
    
    if (isReceived !== null) {
      where.isReceived = isReceived === 'true';
    }

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

    const transformedOrders = orders.map(order => {
      const totalHeadReceived = order.arrivals?.reduce((sum, a) => sum + (a.totalHeadArrived || 0), 0) || 0;
      const totalWeightReceived = order.arrivals?.reduce((sum, a) => sum + (a.netWeightTotal || 0), 0) || 0;
      const avgWeightKg = order.totalHeadOrdered > 0 ? (order.totalWeightKg / order.totalHeadOrdered).toFixed(1) : 0;
      const isFullyReceived = totalHeadReceived >= order.totalHeadOrdered;
      const latestSttb = order.sttbs?.[0];
      const sisaKuota = order.totalHeadOrdered - (order.headReceived || 0);
      const isFull = sisaKuota <= 0;

      return {
        ...order,
        avgWeightKg: parseFloat(avgWeightKg),
        headCount: order.totalHeadOrdered,
        hppAwalPerEkor: order.hppPerEkor,
        totalHeadReceived,
        totalWeightReceived,
        isFullyReceived,
        sisaKuota,
        isFull,
        canReceive: order.status === 'APPROVED' && !order.isReceived && !isFullyReceived,
        canCreateSttb: order.status === 'APPROVED' && !order.isReceived && !latestSttb,
        latestSttb,
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

    let filteredOrders = transformedOrders;
    if (!includeFull) {
      filteredOrders = transformedOrders.filter(order => !order.isFull);
    }

    return NextResponse.json(filteredOrders);
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
    if (!items.length) return NextResponse.json({ message: "Minimal satu item harus diisi." }, { status: 400 });

    // Validasi items tanpa mewajibkan jenisSapi
    for (const it of items) {
      if (!(parseInt(it.headOrdered) > 0)) return NextResponse.json({ message: `Jumlah ekor harus > 0.` }, { status: 400 });
      if (!(parseFloat(it.weightKg) > 0)) return NextResponse.json({ message: `Total bobot harus > 0.` }, { status: 400 });
      if (!(parseFloat(it.pricePerKg) > 0)) return NextResponse.json({ message: `Harga/kg harus > 0.` }, { status: 400 });
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

        // Jika jenisSapi tidak disediakan, gunakan "-"
        const jenisSapi = it.jenisSapi ? it.jenisSapi.toUpperCase() : "-";
        const gender = it.gender || "CAMPUR";

        await tx.cattlePOItem.create({
          data: {
            purchasingId:   po.id,
            jenisSapi,
            gender,
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

// ─── PATCH (untuk update status PO) ───────────────────────────────────────────
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, status, headReceived, isReceived } = body;

    if (!id) return NextResponse.json({ message: "ID PO wajib diisi." }, { status: 400 });

    const updateData = {};
    if (status) updateData.status = status;
    if (headReceived !== undefined) updateData.headReceived = headReceived;
    if (isReceived !== undefined) updateData.isReceived = isReceived;

    const updated = await prisma.cattlePurchasing.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: `PO ${updated.noPO} berhasil diupdate.`,
      data: updated,
    });
  } catch (err) {
    console.error("CATTLE_PO_PATCH:", err.message);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}