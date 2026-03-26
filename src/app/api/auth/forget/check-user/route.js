import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { identifier } = await req.json();

    // Mencari user berdasarkan email ATAU username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: "User tidak ditemukan" }, 
        { status: 404 }
      );
    }

    // Jika user ditemukan, kirim respons sukses
    return NextResponse.json({ 
      success: true,
      message: "User ditemukan" 
    });
    
  } catch (error) {
    console.error("API_CHECK_USER_ERROR:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" }, 
      { status: 500 }
    );
  }
}