import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const contacts = await prisma.contact.findMany({
      where: type && type !== "all" ? { 
        type: type.toUpperCase() 
      } : {},
      include: {
        _count: {
          select: { penjualan: true }
        }
      },
      orderBy: { name: 'asc' },
    });

    const formattedContacts = contacts.map(c => ({
      id: c.id,
      name: c.name,
      nik: c.nik || "-",
      companyName: c.companyName || "-",
      type: c.type.charAt(0) + c.type.slice(1).toLowerCase(),
      displayName: c.companyName ? `${c.companyName} (u.p. ${c.name})` : c.name,
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

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, type, email, phone, address, nik, companyName } = body;

    if (!name || !type) {
      return NextResponse.json({ message: "Nama dan Tipe wajib diisi" }, { status: 400 });
    }

    const newContact = await prisma.contact.create({
      data: {
        name,
        type: type.toUpperCase(),
        nik: nik || null,
        companyName: companyName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
      }
    });

    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    console.error("POST_CONTACTS_ERROR:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "NIK atau Email sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ message: "Gagal menyimpan kontak" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ message: "ID diperlukan" }, { status: 400 });

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: { _count: { select: { penjualan: true } } }
    });

    if (contact?._count.penjualan > 0) {
      return NextResponse.json({ 
        message: "Kontak tidak bisa dihapus karena memiliki data transaksi penjualan" 
      }, { status: 400 });
    }

    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ message: "Kontak berhasil dihapus" }, { status: 200 });
  } catch (error) {
    console.error("DELETE_CONTACT_ERROR:", error);
    return NextResponse.json({ message: "Gagal menghapus kontak" }, { status: 500 });
  }
}