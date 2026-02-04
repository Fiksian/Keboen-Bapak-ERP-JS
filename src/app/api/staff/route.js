import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Pastikan path ini benar
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const staffs = await prisma.staffs.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        User: { 
          select: { 
            username: true,
            email: true, 
            role: true 
          }
        }
      }
    });

    return NextResponse.json(staffs, { status: 200 });
  } catch (error) {
    console.error("GET_STAFF_ERROR:", error);
    return NextResponse.json({ message: "Gagal mengambil data staff" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      username, 
      firstName, 
      lastName, 
      gender, 
      phone, 
      role, 
      designation, 
      email, 
      password 
    } = body;

    if (!username || !firstName || !email || !password || !gender || !designation) {
      return NextResponse.json({ message: "Data tidak lengkap!" }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email atau Username sudah digunakan!" }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    const count = await prisma.staffs.count(); 
    const generatedStaffId = `STF-${currentYear}-${(count + 1).toString().padStart(3, '0')}`;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: role || "Staff",
          phone: phone || null
        }
      });

      const newStaff = await tx.staffs.create({
        data: {
          id: newUser.id,
          firstName,
          lastName,
          gender,
          staffId: generatedStaffId,
          phone: phone || null,
          role: role || "Staff",
          designation,
          email,
          updatedAt: new Date()
        }
      });

      await tx.history.create({
        data: {
          action: "STAFF_CREATE",
          item: `${firstName} ${lastName}`,
          category: "HUMAN_RESOURCE",
          type: "STAFF",
          quantity: 1,
          unit: "PERSON",
          user: session.user.name || "Admin",
          notes: `Menambah staff baru: ${generatedStaffId}`
        }
      });

      return newStaff;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error("POST_STAFF_ERROR:", error);
    return NextResponse.json({ 
      message: "Gagal menambah staff", 
      error: error.message 
    }, { status: 500 });
  }
}