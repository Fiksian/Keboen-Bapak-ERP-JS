// app/api/staff/route.js
// FINAL — gabungan dari:
//   - FormData + upload foto (dari file upload)
//   - identityNo + address (dari output RBAC sebelumnya)
//   - proteksi role SuperAdmin (dari output RBAC sebelumnya)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ─── GET /api/staff ───────────────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SuperAdmin") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const staffs = await prisma.staffs.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        User: {
          select: { username: true, email: true, role: true }
        }
      }
    });

    return NextResponse.json(staffs, { status: 200 });
  } catch (error) {
    console.error("GET_STAFF_ERROR:", error);
    return NextResponse.json({ message: "Gagal mengambil data staff" }, { status: 500 });
  }
}

// ─── POST /api/staff ──────────────────────────────────────────────────────────
// Menerima FormData (multipart) agar bisa menerima file foto.
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SuperAdmin") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Baca FormData
    const data        = await request.formData();
    const username    = data.get("username");
    const firstName   = data.get("firstName");
    const lastName    = data.get("lastName");
    const gender      = data.get("gender");
    const phone       = data.get("phone");
    const role        = data.get("role");
    const designation = data.get("designation");
    const email       = data.get("email");
    const password    = data.get("password");
    const identityNo  = data.get("identityNo");  // ← dari output RBAC
    const address     = data.get("address");      // ← dari output RBAC
    const imageFile   = data.get("file");         // ← dari file upload (key 'file')

    // Validasi field wajib
    if (!username || !firstName || !email || !password || !gender || !designation) {
      return NextResponse.json({ message: "Data tidak lengkap!" }, { status: 400 });
    }

    // Proteksi: tidak boleh assign role SuperAdmin via form
    if (role === "SuperAdmin") {
      return NextResponse.json(
        { message: "Tidak dapat membuat akun dengan role SuperAdmin" },
        { status: 403 }
      );
    }

    // Cek duplikat
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    if (existingUser) {
      return NextResponse.json({ message: "Email atau Username sudah digunakan!" }, { status: 400 });
    }

    // Upload foto jika ada
    let imageUrl = null;
    if (imageFile && typeof imageFile !== "string" && imageFile.size > 0) {
      const bytes    = await imageFile.arrayBuffer();
      const buffer   = Buffer.from(bytes);
      const dir      = path.join(process.cwd(), "public", "uploads", "staff");
      await mkdir(dir, { recursive: true }).catch(() => {});
      const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, "_")}`;
      await writeFile(path.join(dir, fileName), buffer);
      imageUrl = `/uploads/staff/${fileName}`;
    }

    // Generate Staff ID
    const currentYear      = new Date().getFullYear();
    const count            = await prisma.staffs.count();
    const generatedStaffId = `STF-${currentYear}-${(count + 1).toString().padStart(3, "0")}`;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role:  role  || "Staff",
          phone: phone || null,
          image: imageUrl,          // ← field baru di User
        }
      });

      const newStaff = await tx.staffs.create({
        data: {
          id:          newUser.id,
          firstName,
          lastName,
          gender,
          staffId:     generatedStaffId,
          phone:       phone      || null,
          role:        role       || "Staff",
          designation,
          email,
          image:       imageUrl,   // ← field baru di staffs
          identityNo:  identityNo || null,  // ← dari output RBAC
          address:     address    || null,  // ← dari output RBAC
          updatedAt:   new Date()
        }
      });

      await tx.history.create({
        data: {
          action:   "STAFF_CREATE",
          item:     `${firstName} ${lastName}`,
          category: "HUMAN_RESOURCE",
          type:     "STAFF",
          quantity: 1,
          unit:     "PERSON",
          user:     session.user.name || "Admin",
          notes:    `Menambah staff baru: ${generatedStaffId}`
        }
      });

      return newStaff;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST_STAFF_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal menambah staff", error: error.message },
      { status: 500 }
    );
  }
}
