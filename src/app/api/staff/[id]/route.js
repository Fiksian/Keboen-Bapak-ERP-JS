import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request, { params }) {
  try {
    // 1. Ekstrak ID secara asynchronous (Wajib di Next.js 15+)
    const { id } = await params;
    
    // 2. Ambil body request
    const body = await request.json();

    // 3. Destrukturisasi untuk memisahkan data yang akan diupdate
    // Kita buang id, createdAt, dan updatedAt agar tidak ikut dikirim ke query update
    const { id: _, createdAt, updatedAt, ...updateData } = body;

    // 4. Cek apakah staff ada
    const existingStaff = await prisma.staff.findUnique({
      where: { id: id }
    });

    if (!existingStaff) {
      return NextResponse.json({ message: "Staff tidak ditemukan" }, { status: 404 });
    }

    // 5. Eksekusi Update
    const updatedStaff = await prisma.staff.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json(updatedStaff, { status: 200 });
  } catch (error) {
    console.error("DEBUG UPDATE ERROR:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui data", detail: error.message }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await prisma.staff.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: "Staff berhasil dihapus" }, { status: 200 });
  } catch (error) {
    console.error("DEBUG DELETE ERROR:", error);
    return NextResponse.json({ message: "Gagal menghapus staff" }, { status: 500 });
  }
}