// app/api/cattle/delivery-order/[id]/create-po/route.js
//
// ─── ENDPOINT: Buat PO dari DO Item (untuk CATTLE module) ─────────────────────

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ─── Generate nomor PO ────────────────────────────────────────────────────────
const generateNoPO = async (tx) => {
  const now = new Date();
  const prefix = `CPO/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/`;
  const lastPO = await tx.cattlePurchasing.findFirst({
    where: { noPO: { startsWith: prefix } },
    orderBy: { noPO: "desc" },
    select: { noPO: true },
  });
  const seq = lastPO ? parseInt(lastPO.noPO.split("/").pop()) + 1 : 1;
  return `${prefix}${String(seq).padStart(3, "0")}`;
};

// ─── Kalkulasi HPP ─────────────────────────────────────────────────────────────
const calcHpp = ({
  pricePerKgIDR = 0, totalWeightKg = 0,
  biayaBongkar = 0, biayaTracking = 0, biayaKarantina = 0, biayaLainLain = 0,
  totalHeadOrdered = 0,
}) => {
  const totalBiayaPerKg = totalWeightKg > 0
    ? (parseFloat(biayaBongkar) + parseFloat(biayaTracking) + parseFloat(biayaKarantina) + parseFloat(biayaLainLain)) / parseFloat(totalWeightKg)
    : 0;
  const hppPerKg = parseFloat(pricePerKgIDR) + totalBiayaPerKg;
  const hppPerEkor = totalHeadOrdered > 0 ? (hppPerKg * parseFloat(totalWeightKg)) / parseFloat(totalHeadOrdered) : 0;
  const hppTotal = hppPerEkor * parseFloat(totalHeadOrdered);
  return { hppPerKg: parseFloat(hppPerKg.toFixed(2)), hppPerEkor: parseFloat(hppPerEkor.toFixed(2)), hppTotal: parseFloat(hppTotal.toFixed(2)) };
};

// ─── Recalculate DO Status ─────────────────────────────────────────────────────
const recalcDOStatus = async (tx, doId) => {
  const allItems = await tx.cattleDOItem.findMany({
    where: { deliveryOrderId: doId }
  });
  const allFulfilled = allItems.every(i => i.headOrdered >= i.headRequired);
  const anyOrdered = allItems.some(i => i.headOrdered > 0);
  
  await tx.cattleDeliveryOrder.update({
    where: { id: doId },
    data: { status: allFulfilled ? "FULFILLED" : anyOrdered ? "PARTIAL" : "APPROVED" }
  });
};

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: doId } = await params;
    const body = await request.json();
    const { items } = body;
    const userName = session.user.name || session.user.email;

    if (!items?.length) {
      return NextResponse.json({ message: "Minimal satu item harus dipilih" }, { status: 400 });
    }

    // ── Validasi DO ───────────────────────────────────────────────────────────
    const do_ = await prisma.cattleDeliveryOrder.findUnique({
      where: { id: doId },
      include: { items: true },
    });
    
    if (!do_) {
      return NextResponse.json({ message: "DO tidak ditemukan" }, { status: 404 });
    }
    
    if (!["APPROVED", "PARTIAL"].includes(do_.status)) {
      return NextResponse.json({
        message: `DO harus berstatus APPROVED atau PARTIAL (sekarang: ${do_.status})`,
      }, { status: 400 });
    }

    const doItemMap = Object.fromEntries(do_.items.map(i => [i.id, i]));

    // ── Validasi setiap item ───────────────────────────────────────────────────
    for (const entry of items) {
      const doItem = doItemMap[entry.doItemId];
      if (!doItem) {
        return NextResponse.json({ message: `Item ID "${entry.doItemId}" tidak ada dalam DO ini` }, { status: 400 });
      }
      if (!entry.vendorName?.trim()) {
        return NextResponse.json({ message: `Vendor untuk ${doItem.jenisSapi} wajib diisi` }, { status: 400 });
      }
      if (!entry.pricePerKg || parseFloat(entry.pricePerKg) <= 0) {
        return NextResponse.json({ message: `Harga untuk ${doItem.jenisSapi} harus lebih dari 0` }, { status: 400 });
      }
      const weightKg = parseFloat(entry.weightKg) || 0;
      if (weightKg <= 0) {
        return NextResponse.json({ message: `Bobot untuk ${doItem.jenisSapi} harus lebih dari 0` }, { status: 400 });
      }
    }

    // ── Buat semua PO dalam satu transaksi ────────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      const createdPOs = [];

      for (const entry of items) {
        const doItem = doItemMap[entry.doItemId];
        const headOrdered = parseInt(entry.headOrdered) || doItem.headRequired - (doItem.headOrdered || 0);
        const weightKg = parseFloat(entry.weightKg) || 0;
        const pricePerKg = parseFloat(entry.pricePerKg) || 0;
        const totalHarga = weightKg * pricePerKg;
        const avgWeightKg = headOrdered > 0 ? weightKg / headOrdered : 0;
        const pricePerHeadUSD = entry.pricePerHeadUSD || 0;

        // Hitung HPP untuk PO ini
        const totalHeadForPO = headOrdered;
        const totalWeightForPO = weightKg;
        const hpp = calcHpp({
          pricePerKgIDR: pricePerKg,
          totalWeightKg: totalWeightForPO,
          biayaBongkar: entry.biayaBongkar || 0,
          biayaTracking: entry.biayaTracking || 0,
          biayaKarantina: entry.biayaKarantina || 0,
          biayaLainLain: entry.biayaLainLain || 0,
          totalHeadOrdered: totalHeadForPO,
        });

        const noPO = await generateNoPO(tx);

        // Buat CattlePurchasing
        const po = await tx.cattlePurchasing.create({
          data: {
            noPO,
            vendorName: entry.vendorName.toUpperCase(),
            vendorCountry: entry.vendorCountry || "Australia",
            vendorEksportir: entry.vendorEksportir || null,
            totalHeadOrdered: headOrdered,
            totalWeightKg: weightKg,
            pricePerKgIDR: pricePerKg,
            pricePerHeadUSD: pricePerHeadUSD,
            exchangeRate: entry.exchangeRate || 0,
            biayaBongkar: entry.biayaBongkar || 0,
            biayaTracking: entry.biayaTracking || 0,
            biayaKarantina: entry.biayaKarantina || 0,
            biayaLainLain: entry.biayaLainLain || 0,
            hppPerKg: hpp.hppPerKg,
            hppPerEkor: hpp.hppPerEkor,
            hppTotal: hpp.hppTotal,
            totalEstimasi: totalHarga,
            requestedBy: userName,
            status: "PENDING",
            warehouseId: entry.warehouseId || null,
            notes: entry.notes || `Dari DO: ${do_.doNo}`,
          },
        });

        // Buat CattlePOItem
        await tx.cattlePOItem.create({
          data: {
            purchasingId: po.id,
            doItemId: doItem.id,
            breedId: doItem.breedId,
            jenisSapi: doItem.jenisSapi,
            gender: doItem.gender,
            headOrdered: headOrdered,
            weightKg: weightKg,
            avgWeightKg: avgWeightKg,
            pricePerKg: pricePerKg,
            totalHarga: totalHarga,
            pricePerHeadUSD: pricePerHeadUSD,
            notes: entry.notes || null,
          },
        });

        // Update DO Item
        await tx.cattleDOItem.update({
          where: { id: doItem.id },
          data: {
            headOrdered: { increment: headOrdered },
            weightOrderedKg: { increment: weightKg },
          },
        });

        // History
        await tx.history.create({
          data: {
            action: "CATTLE_PO_CREATED_FROM_DO",
            item: `${headOrdered} ekor - ${entry.vendorName}`,
            category: "Cattle",
            type: "LIVESTOCK",
            quantity: headOrdered,
            unit: "EKOR",
            user: userName,
            referenceId: po.id,
            notes: `PO ${noPO} dari DO ${do_.doNo} | ${weightKg} kg | Rp ${pricePerKg}/kg`,
          },
        });

        createdPOs.push(po);
      }

      // Recalculate status DO
      await recalcDOStatus(tx, doId);

      return createdPOs;
    });

    return NextResponse.json({
      message: `${result.length} PO berhasil dibuat dari DO ${do_.doNo}`,
      data: result,
    }, { status: 201 });

  } catch (error) {
    console.error("CREATE_PO_FROM_DO_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}