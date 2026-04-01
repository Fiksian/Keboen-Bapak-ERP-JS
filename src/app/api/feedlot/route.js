import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, data, userEmail } = body;

    const result = await prisma.$transaction(async (tx) => {
      if (type === 'penerimaan') {
        // 1. Tambah ke model Stock
        // Kita menggunakan Eartag sebagai pembeda unik di field 'name'
        const stockName = `${data.jenisSapiTerima} [${data.noEartagTerima}]`;
        
        const newLivestock = await tx.stock.create({
          data: {
            name: stockName,
            category: "LIVESTOCK", // Pembeda dengan bahan pakan
            stock: 1,              // Satuan ekor
            unit: "EKOR",
            type: "ASSET",         // Sesuai enum/string di schema
            status: "ACTIVE",
            lastPurchasedId: data.noPo || null, // Relasi ke noPO Purchasing jika ada
            price: null,           // Bisa diupdate jika ada data harga
          }
        });

        // 2. Catat ke model History
        await tx.history.create({
          data: {
            action: "RECEIVE_LIVESTOCK",
            item: stockName,
            category: "LIVESTOCK",
            type: "IN",
            quantity: parseFloat(data.beratTerima), // Simpan berat di quantity history
            unit: "KG",
            user: userEmail,
            referenceId: data.noPo || data.shipmentTerima,
            notes: `RFID: ${data.noRfidTerima}, Importir: ${data.namaImportir}`
          }
        });

        return newLivestock;

      } else if (type === 'mutasi') {
        // 1. Cari sapi di Stock berdasarkan Eartag
        const targetStock = await tx.stock.findFirst({
          where: { 
            name: { contains: data.noEartagMutasi },
            category: "LIVESTOCK"
          }
        });

        if (!targetStock) {
          throw new Error("Data sapi tidak ditemukan atau sudah dikeluarkan.");
        }

        // 2. Update Stock (Set stock ke 0 dan beri status mutasi)
        await tx.stock.update({
          where: { id: targetStock.id },
          data: { 
            stock: 0, 
            status: `MUTATED_${data.jenisMutasi}` 
          }
        });

        // 3. Catat ke model History
        await tx.history.create({
          data: {
            action: `MUTASI_${data.jenisMutasi}`,
            item: targetStock.name,
            category: "LIVESTOCK",
            type: "OUT",
            quantity: parseFloat(data.beratMutasi),
            unit: "KG",
            user: userEmail,
            referenceId: data.noRfidMutasi,
            notes: `Alasan: ${data.jenisMutasi}`
          }
        });

        return { message: "Mutasi berhasil dicatat" };
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Feedlot API Error:", error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}