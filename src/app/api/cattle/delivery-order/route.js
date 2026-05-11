// app/api/cattle/delivery-order/route.js
//
// GET  /api/cattle/delivery-order?status=xxx   — list DO sapi
// POST /api/cattle/delivery-order              — buat DO baru

import { NextResponse }    from "next/server";
import prisma              from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions }     from "@/app/api/auth/[...nextauth]/route";

const generateDONo = async (tx) => {
  const now    = new Date();
  const prefix = `CDO/${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,"0")}/`;
  const last   = await tx.cattleDeliveryOrder.findFirst({
    where: { doNo: { startsWith: prefix } },
    orderBy: { doNo: "desc" },
    select: { doNo: true },
  });
  const seq = last ? parseInt(last.doNo.split("/").pop()) + 1 : 1;
  return `${prefix}${String(seq).padStart(3,"0")}`;
};

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const orders = await prisma.cattleDeliveryOrder.findMany({
      where: status ? { status: status } : {},
      include: {
        items: {
          include: {
            breed: true,
            purchasingOrders: {
              // HANYA include - jangan pakai select
              include: {
                purchasing: {
                  select: {
                    noPO: true,
                    vendorName: true,
                    status: true,
                    isReceived: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (err) {
    console.error("CATTLE_DO_GET:", err.message);
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
      title, expectedDate, notes,
      items = [],
    } = body;

    if (!items.length) return NextResponse.json({ message: "Minimal satu item harus diisi." }, { status: 400 });
    
    for (const it of items) {
      if (!it.jenisSapi) return NextResponse.json({ message: "Jenis sapi wajib diisi." }, { status: 400 });
      if (!(parseInt(it.headRequired) > 0)) return NextResponse.json({ message: `Jumlah ekor "${it.jenisSapi}" harus > 0.` }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Validasi breedId
      const breedIds = items.filter(it => it.breedId).map(it => it.breedId);
      if (breedIds.length > 0) {
        const existingBreeds = await tx.cattleBreed.findMany({
          where: { id: { in: breedIds } },
          select: { id: true }
        });
        
        const existingBreedIds = new Set(existingBreeds.map(b => b.id));
        const invalidBreeds = breedIds.filter(id => !existingBreedIds.has(id));
        
        if (invalidBreeds.length > 0) {
          throw new Error(`Breed ID tidak valid: ${invalidBreeds.join(', ')}`);
        }
      }

      const doNo = await generateDONo(tx);

      const do_ = await tx.cattleDeliveryOrder.create({
        data: {
          doNo,
          title: title || null,
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          notes: notes || null,
          requestedBy: session.user.name || session.user.email,
          status: "PENDING",
        },
      });

      for (const it of items) {
        const head    = parseInt(it.headRequired) || 0;
        const wt      = parseFloat(it.weightRequiredKg) || 0;
        const harga   = parseFloat(it.estimasiHargaPerKg) || 0;
        const est     = wt * harga;

        await tx.cattleDOItem.create({
          data: {
            deliveryOrderId:    do_.id,
            jenisSapi:          it.jenisSapi.toUpperCase(),
            gender:             it.gender || "CAMPUR",
            headRequired:       head,
            weightRequiredKg:   wt,
            estimasiHargaPerKg: harga,
            estimasiTotal:      est,
            breedId:            it.breedId || null,
            notes:              it.notes || null,
            headOrdered:        0,
            weightOrderedKg:    0,
          },
        });
      }

      await tx.history.create({
        data: {
          action:      "CATTLE_DO_CREATED",
          item:        title || doNo,
          category:    "Cattle",
          type:        "LIVESTOCK",
          quantity:    items.reduce((s, i) => s + (parseInt(i.headRequired)||0), 0),
          unit:        "EKOR",
          user:        session.user.name || "System",
          referenceId: do_.id,
          notes:       `DO ${doNo} dibuat. ${items.length} jenis sapi.`,
        },
      });

      return do_;
    });

    return NextResponse.json({
      message: `DO ${result.doNo} berhasil dibuat.`,
      data: result,
    }, { status: 201 });

  } catch (err) {
    console.error("CATTLE_DO_POST:", err.message);
    
    if (err.code === "P2003") {
      return NextResponse.json({ 
        message: "Breed ID tidak valid. Pastikan breed yang dipilih sudah terdaftar." 
      }, { status: 400 });
    }
    
    if (err.code === "P2002") {
      return NextResponse.json({ message: "Nomor DO duplikat. Coba lagi." }, { status: 409 });
    }
    
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}