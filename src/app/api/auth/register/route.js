import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { username, email, password, phone } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ message: "Username, Email, dan Password wajib diisi" }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return NextResponse.json({ message: "Username atau Email sudah terdaftar" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          phone: phone || null,
          role: "Staff", 
        },
      });

      const newStaff = await tx.staff.create({
        data: {
          email: email,
          staffId: `STF-${Math.floor(1000 + Math.random() * 9000)}`,
          firstName: username,
          lastName: "", 
          gender: "Male",
          phone: phone || "",
          role: 'Staff',
          designation: "Staff",
        },
      });

      return { user: newUser, staff: newStaff };
    });

    return NextResponse.json({ 
      message: "Registrasi akun dan profil staff berhasil", 
      user: { 
        username: result.user.username,
        email: result.user.email 
      } 
    }, { status: 201 });

  } catch (error) {
    console.error("REGISTRATION_ERROR:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "Email atau Staff ID sudah digunakan" }, { status: 400 });
    }
    return NextResponse.json({ message: "Gagal memproses pendaftaran" }, { status: 500 });
  }
}