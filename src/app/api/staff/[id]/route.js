import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(request, { params }) {
  try {
    // 1. Validasi Sesi
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Handling Params (Penting: Await params untuk kompatibilitas Next.js terbaru)
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id || id === 'undefined') {
      return NextResponse.json({ message: "ID Staff tidak valid" }, { status: 400 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, gender, designation, role, email } = body;

    // 3. Cari data lama untuk referensi email relasi
    const oldStaff = await prisma.staff.findUnique({
      where: { id: id },
    });

    if (!oldStaff) {
      return NextResponse.json({ message: "Data staff tidak ditemukan" }, { status: 404 });
    }

    // Cek hak akses: Harus Admin atau pemilik akun itu sendiri
    const isAdmin = session.user.role === "Admin";
    const isOwner = session.user.email === oldStaff.email;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "Forbidden Access" }, { status: 403 });
    }

    // 4. Transaksi Database (Atomic Update)
    // Menjamin data di tabel User dan Staff sinkron atau gagal keduanya
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Jika Email berubah, update tabel User (Parent) terlebih dahulu
      if (email && email !== oldStaff.email) {
        // Cek duplikasi email di seluruh sistem
        const exist = await tx.user.findUnique({ where: { email } });
        if (exist) throw new Error("Email ini sudah terdaftar di akun lain");

        await tx.user.update({
          where: { email: oldStaff.email },
          data: { email: email }
        });
      }

      // B. Update data di tabel Staff
      const updatedStaff = await tx.staff.update({
        where: { id: id },
        data: {
          firstName,
          lastName,
          phone,
          gender,
          email, // Samakan email dengan tabel User karena ini Foreign Key
          ...(isAdmin && { designation, role }),
        },
      });

      // C. Sinkronisasi Role di tabel User jika diubah oleh Admin
      if (isAdmin && role) {
        await tx.user.update({
          where: { email: email || oldStaff.email },
          data: { role: role }
        });
      }

      return updatedStaff;
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("STAFF_PATCH_ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Gagal memperbarui data" }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ message: "Hanya Admin yang diizinkan" }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) return NextResponse.json({ message: "ID diperlukan" }, { status: 400 });

    const staff = await prisma.staff.findUnique({ where: { id: id } });

    if (!staff) {
      return NextResponse.json({ message: "Staff tidak ditemukan" }, { status: 404 });
    }

    // Hapus melalui tabel User agar relasi Staff terhapus secara otomatis (Cascade)
    await prisma.user.delete({
      where: { email: staff.email }
    });

    return NextResponse.json({ message: "Data berhasil dihapus" }, { status: 200 });
  } catch (error) {
    console.error("STAFF_DELETE_ERROR:", error);
    return NextResponse.json({ message: "Gagal menghapus data" }, { status: 500 });
  }
}