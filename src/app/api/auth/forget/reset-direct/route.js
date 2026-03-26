import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { identifier, oldPassword, newPassword } = await req.json();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }]
      }
    });

    if (!user) {
      return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 });
    }

    // Validasi Password Lama menggunakan bcrypt
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Password lama salah!" }, { status: 401 });
    }

    // Hash Password Baru sebelum disimpan
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ message: "Password berhasil diperbarui" });

  } catch (error) {
    return NextResponse.json({ message: "Gagal memproses permintaan" }, { status: 500 });
  }
}