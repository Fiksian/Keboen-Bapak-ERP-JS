import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();

    // 1. Validasi Input
    if (!username || !email || !password) {
      return NextResponse.json({ message: "Semua data wajib diisi" }, { status: 400 });
    }

    // 2. Cek apakah user sudah ada
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return NextResponse.json({ message: "Username atau Email sudah terdaftar" }, { status: 400 });
    }

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Simpan ke Database
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ 
      message: "Registrasi berhasil", 
      user: { username: newUser.username } 
    }, { status: 201 });

  } catch (error) {
    console.error("REGISTRATION_ERROR:", error);
    return NextResponse.json({ message: "Gagal membuat akun" }, { status: 500 });
  }
}