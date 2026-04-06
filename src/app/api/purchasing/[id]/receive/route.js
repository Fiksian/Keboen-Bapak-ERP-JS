// app/api/purchasing/[id]/receive/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ─── Auto-status stok ─────────────────────────────────────────────────────────
const getAutoStatus = (qty) => {
  const q = parseFloat(qty) || 0;
  if (q <= 0)  return "EMPTY";
  if (q <= 10) return "LIMITED";
  return "READY";
};

// ─── Generate nomor STTB ──────────────────────────────────────────────────────
// Format: STTB/YYYYMMDD/XXXX
const generateSttbNo = async (tx, dateStr) => {
  const prefix = `STTB/${dateStr}/`;
  const count  = await tx.sTTB.count({ where: { sttbNo: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
};

export async function PATCH(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const data   = await request.formData();

    // ── Ambil field dari form ─────────────────────────────────────────────────
    const suratJalan  = data.get("suratJalan");
    const vehicleNo   = data.get("vehicleNo");
    const condition   = data.get("condition");
    const notes       = data.get("notes");
    const receivedQty = data.get("receivedQty");
    const receivedBy  = data.get("receivedBy");
    const beratIsi    = data.get("beratIsi");
    const beratKosong = data.get("beratKosong");
    const netto       = data.get("netto");
    const imageFile   = data.get("file");

    // warehouseId TIDAK ada di form ini — diisi saat Approval STTB stage 3

    // ── Upload foto ───────────────────────────────────────────────────────────
    let imageUrl = null;
    if (imageFile && typeof imageFile !== "string" && imageFile.size > 0) {
      const bytes  = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const dir    = path.join(process.cwd(), "public", "uploads", "receipts");
      await mkdir(dir, { recursive: true }).catch(() => {});
      const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, "_")}`;
      await writeFile(path.join(dir, fileName), buffer);
      imageUrl = `/uploads/receipts/${fileName}`;
    }

    const userName    = receivedBy || session.user.name || "Warehouse Staff";
    const currentTime = new Date();
    const dateStr     = currentTime.toISOString().split("T")[0].replace(/-/g, "");

    // ── Cek PO ───────────────────────────────────────────────────────────────
    const purchase = await prisma.purchasing.findUnique({ where: { id } });
    if (!purchase) {
      return NextResponse.json({ message: "Data pengadaan tidak ditemukan" }, { status: 404 });
    }
    if (purchase.isReceived) {
      return NextResponse.json({ message: "Barang sudah pernah diterima sebelumnya" }, { status: 400 });
    }

    // Prioritaskan netto (hasil timbang), fallback ke receivedQty, lalu qty PO
    const incomingQty = netto
      ? parseFloat(netto)
      : receivedQty ? parseFloat(receivedQty) : (purchase.qty || 0);
    const unitLabel   = purchase.unit || "Unit";

    // ── Transaksi: Receipt + update PO + STTB otomatis ───────────────────────
    const result = await prisma.$transaction(async (tx) => {

      // 1. Buat Receipt — warehouseId NULL dulu (diisi nanti di STTB approval)
      const receiptNo = `GRN-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
      const receipt   = await tx.receipt.create({
        data: {
          receiptNo,
          purchasingId: id,
          suratJalan:   suratJalan || "TANPA-SJ",
          imageUrl,
          vehicleNo:    vehicleNo  || "N/A",
          receivedQty:  incomingQty,
          grossWeight:  parseFloat(beratIsi)    || 0,
          tareWeight:   parseFloat(beratKosong) || 0,
          netWeight:    parseFloat(netto)       || 0,
          receivedBy:   userName,
          condition:    condition  || "GOOD",
          notes:        notes      || "",
          receivedAt:   currentTime,
          // warehouseId: null — diisi saat STTB final approved
        },
      });

      // 2. Update PO → RECEIVED
      await tx.purchasing.update({
        where: { id },
        data:  { isReceived: true, status: "RECEIVED" },
      });

      // 3. Buat STTB otomatis — status awal PENDING_QC
      //    QC stage (stage 1) langsung diisi oleh sistem (auto-QC saat arrival)
      const sttbNo = await generateSttbNo(tx, dateStr);
      const sttb   = await tx.sTTB.create({
        data: {
          sttbNo,
          receiptId:    receipt.id,
          purchasingId: id,
          status:       "PENDING_QC",
          // QC otomatis dicatat oleh sistem saat barang diterima
          qcApprovedBy: userName,
          qcApprovedAt: currentTime,
          qcNotes:      `Auto-QC: Diterima di dock penerimaan. Kondisi: ${condition || "GOOD"}`,
        },
      });

      // 4. Catat History
      await tx.history.create({
        data: {
          action:      "STOCK_IN_PENDING",
          item:        purchase.item,
          category:    purchase.category || "General",
          type:        purchase.type     || "STOCKS",
          quantity:    incomingQty,
          unit:        unitLabel,
          user:        userName,
          referenceId: sttb.id,
          notes:       `PO: ${purchase.noPO} | SJ: ${suratJalan} | STTB: ${sttbNo} | Menunggu Approval`,
        },
      });

      return { receipt, sttb };
    });

    return NextResponse.json({
      message:   `Penerimaan PO ${purchase.noPO} berhasil. STTB ${result.sttb.sttbNo} dibuat, menunggu approval.`,
      receiptNo: result.receipt.receiptNo,
      sttbNo:    result.sttb.sttbNo,
      sttbId:    result.sttb.id,
      imageUrl,
      receivedAt: currentTime,
    }, { status: 200 });

  } catch (error) {
    console.error("RECEIVE_ERROR:", error);
    return NextResponse.json({
      message: "Gagal memproses penerimaan barang",
      error:   error.message,
    }, { status: 500 });
  }
}
