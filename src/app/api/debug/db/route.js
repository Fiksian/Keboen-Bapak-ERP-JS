import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.$queryRaw`SELECT NOW() as server_time`;
    const localTime = new Date(result[0].server_time).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    });

    return NextResponse.json({
    status: "Connected",
    database: "PostgreSQL",
    prisma_version: "6.2.1",
    server_time: localTime,
    message: "Koneksi database berjalan dengan sempurna!",
    }, { status: 200 });

  } catch (error) {
    console.error("DEBUG DB ERROR:", error);
    
    return NextResponse.json({
      status: "Disconnected",
      message: "Gagal terhubung ke database.",
      error_message: error.message,
      hint: "Cek apakah service postgresql sudah jalan (sudo systemctl start postgresql) dan cek URL di .env"
    }, { status: 500 });
  }
}a