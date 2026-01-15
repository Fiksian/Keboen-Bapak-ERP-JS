import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Mengambil semua data staff
export async function GET() {
  try {
    const staffs = await prisma.staff.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(staffs, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Gagal mengambil data staff" }, { status: 500 });
  }
}

// POST: Menambah staff baru
export async function POST(request) {
  try {
    const body = await request.json();
    const { firstName, lastName, gender, staffId, phone, role, designation } = body;

    // Cek apakah staffId sudah terdaftar
    const existingStaff = await prisma.staff.findUnique({
      where: { staffId }
    });

    if (existingStaff) {
      return NextResponse.json({ message: "Staff ID sudah terdaftar!" }, { status: 400 });
    }

    const newStaff = await prisma.staff.create({
      data: { firstName, lastName, gender, staffId, phone, role, designation }
    });

    return NextResponse.json(newStaff, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Gagal menambah staff" }, { status: 500 });
  }
}