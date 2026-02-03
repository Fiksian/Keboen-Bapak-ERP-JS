import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id || id === 'undefined') {
      return NextResponse.json({ message: "ID Staff tidak valid" }, { status: 400 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, gender, designation, role, email } = body;

    const oldStaff = await prisma.staffs.findUnique({
      where: { id: id },
    });

    if (!oldStaff) {
      return NextResponse.json({ message: "Data staff tidak ditemukan" }, { status: 404 });
    }

    const isAdmin = session.user.role === "Admin";
    const isOwner = session.user.email === oldStaff.email;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "Forbidden Access" }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      
      if (email && email !== oldStaff.email) {
        const exist = await tx.user.findUnique({ where: { email } });
        if (exist) throw new Error("Email ini sudah terdaftar di akun lain");

        await tx.user.update({
          where: { email: oldStaff.email },
          data: { email: email }
        });
      }

      const updatedStaff = await tx.staff.update({
        where: { id: id },
        data: {
          firstName,
          lastName,
          phone,
          gender,
          email, 
          ...(isAdmin && { designation, role }),
        },
      });

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

    const { id } = await params;
    if (!id) return NextResponse.json({ message: "ID diperlukan" }, { status: 400 });

    const staff = await prisma.staff.findUnique({ 
      where: { id: id } 
    });

    if (!staff) {
      return NextResponse.json({ message: "Staff tidak ditemukan" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.user.delete({
        where: { email: staff.email }
      }),
      prisma.staff.delete({
        where: { id: id }
      })
    ]);

    return NextResponse.json({ message: "Data berhasil dihapus" }, { status: 200 });
  } catch (error) {
    console.error("STAFF_DELETE_ERROR:", error);
    return NextResponse.json({ 
      message: "Gagal menghapus data",
      detail: error.message 
    }, { status: 500 });
  }
}