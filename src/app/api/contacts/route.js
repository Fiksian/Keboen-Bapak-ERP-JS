import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Mengambil semua kontak
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Mengambil parameter search dari URL jika ada
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // misal: ?type=CUSTOMER

    const contacts = await prisma.contact.findMany({
      where: type && type !== "all" ? { 
        type: type.toUpperCase() 
      } : {},
      include: {
        _count: {
          select: { penjualan: true } // Menghitung jumlah transaksi per kontak
        }
      },
      orderBy: { name: 'asc' },
    });

    // Formatter agar sesuai dengan kebutuhan UI
    const formattedContacts = contacts.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type.charAt(0) + c.type.slice(1).toLowerCase(), // CUSTOMER -> Customer
      contactPerson: c.name, // atau tambahkan field PIC di skema jika perlu
      email: c.email || "-",
      phone: c.phone || "-",
      address: c.address || "-",
      transactionCount: c._count.penjualan
    }));

    return NextResponse.json(formattedContacts, { status: 200 });
  } catch (error) {
    console.error("GET_CONTACTS_ERROR:", error);
    return NextResponse.json({ message: "Gagal mengambil data kontak" }, { status: 500 });
  }
}

// POST: Membuat kontak baru
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, type, email, phone, address } = body;

    // Validasi input minimal
    if (!name || !type) {
      return NextResponse.json({ message: "Nama dan Tipe wajib diisi" }, { status: 400 });
    }

    const newContact = await prisma.contact.create({
      data: {
        name,
        type: type.toUpperCase(), // CUSTOMER atau SUPPLIER
        email: email || null,
        phone: phone || null,
        address: address || null,
      }
    });

    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    console.error("POST_CONTACTS_ERROR:", error);
    return NextResponse.json({ message: "Gagal menyimpan kontak" }, { status: 500 });
  }
}