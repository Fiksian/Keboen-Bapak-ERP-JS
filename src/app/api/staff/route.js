import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const staffs = await prisma.staffs.findMany({
      where: {
        User: {
          id: { not: undefined }
        }
      },
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

    if (!username || !firstName || !email || !password) {
      return NextResponse.json({ message: "Data tidak lengkap!" }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    const count = await prisma.staff.count();
    const generatedStaffId = `STF-${currentYear}-${(count + 1).toString().padStart(3, '0')}`;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email atau Username sudah digunakan!" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: role || "Staff",
        }
      });

      const newStaff = await tx.staff.create({
        data: {
          id: newUser.id,
          firstName,
          lastName,
          gender,
          staffId: generatedStaffId,
          phone,
          role: role || "Staff",
          designation,
          email,
        }
      });

      return { newUser, newStaff };
    });

    return NextResponse.json(result.newStaff, { status: 201 });

  } catch (error) {
    console.error("POST_STAFF_ERROR:", error);
    return NextResponse.json({ 
      message: "Gagal menambah staff", 
      error: error.message 
    }, { status: 500 });
  }
}