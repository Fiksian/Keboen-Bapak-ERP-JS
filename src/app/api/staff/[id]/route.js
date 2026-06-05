// app/api/staff/[id]/route.js
// FINAL — gabungan dari:
//   - FormData + upload foto (dari file upload)
//   - identityNo + address (dari output RBAC sebelumnya)
//   - proteksi role SuperAdmin (dari output RBAC sebelumnya)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ─── PATCH /api/staff/[id] ────────────────────────────────────────────────────
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || id === "undefined") {
      return NextResponse.json({ message: "ID Staff tidak valid" }, { status: 400 });
    }

    // Baca FormData
    const data        = await request.formData();
    const firstName   = data.get("firstName");
    const lastName    = data.get("lastName");
    const phone       = data.get("phone");
    const gender      = data.get("gender");
    const designation = data.get("designation");
    const role        = data.get("role");
    const email       = data.get("email");
    const identityNo  = data.get("identityNo");  // ← dari output RBAC
    const address     = data.get("address");      // ← dari output RBAC
    const imageFile   = data.get("file");         // ← dari file upload (key 'file')

    const oldStaff = await prisma.staffs.findUnique({ where: { id } });
    if (!oldStaff) {
      return NextResponse.json({ message: "Data staff tidak ditemukan" }, { status: 404 });
    }

    const isAdmin = session.user.role === "SuperAdmin";
    const isOwner = session.user.email === oldStaff.email;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "Forbidden Access" }, { status: 403 });
    }

    // Proteksi: non-SuperAdmin tidak bisa mengubah role menjadi SuperAdmin
    if (!isAdmin && role && role === "SuperAdmin") {
      return NextResponse.json(
        { message: "Tidak diizinkan mengubah role ke SuperAdmin" },
        { status: 403 }
      );
    }

    // Upload foto baru jika ada
    let imageUrl = oldStaff.image;  // Pertahankan foto lama jika tidak ada file baru
    if (imageFile && typeof imageFile !== "string" && imageFile.size > 0) {
      const bytes    = await imageFile.arrayBuffer();
      const buffer   = Buffer.from(bytes);
      const dir      = path.join(process.cwd(), "public", "uploads", "staff");
      await mkdir(dir, { recursive: true }).catch(() => {});
      const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, "_")}`;
      await writeFile(path.join(dir, fileName), buffer);
      imageUrl = `/uploads/staff/${fileName}`;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update email di tabel User jika berubah
      if (email && email !== oldStaff.email) {
        const exist = await tx.user.findUnique({ where: { email } });
        if (exist) throw new Error("Email ini sudah terdaftar di akun lain");
        await tx.user.update({
          where: { email: oldStaff.email },
          data:  { email }
        });
      }

      // Sync image ke tabel User
      await tx.user.update({
        where: { id },
        data:  { image: imageUrl }
      });

      // Update staffs
      const updatedStaff = await tx.staffs.update({
        where: { id },
        data: {
          firstName,
          lastName,
          phone,
          gender,
          email,
          image:      imageUrl,                            // ← foto
          identityNo: identityNo ?? oldStaff.identityNo,  // ← dari output RBAC
          address:    address    ?? oldStaff.address,      // ← dari output RBAC
          ...(isAdmin && { designation, role }),
          updatedAt: new Date()
        }
      });

      // Sync role di tabel User
      if (isAdmin && role) {
        await tx.user.update({
          where: { id },
          data:  { role }
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

// ─── DELETE /api/staff/[id] ───────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SuperAdmin") {
      return NextResponse.json({ message: "Hanya SuperAdmin yang diizinkan" }, { status: 403 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ message: "ID diperlukan" }, { status: 400 });

    const staff = await prisma.staffs.findUnique({ where: { id } });
    if (!staff) {
      return NextResponse.json({ message: "Staff tidak ditemukan" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.history.create({
        data: {
          action:   "STAFF_DELETE",
          item:     `${staff.firstName} ${staff.lastName}`,
          category: "HUMAN_RESOURCE",
          type:     "STAFF",
          quantity: 0,
          user:     session.user.name || "Admin",
          notes:    `Menghapus staff ID: ${staff.staffId}`
        }
      });
      // Hapus User → cascade ke staffs otomatis
      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json(
      { message: "Data staff dan akun user berhasil dihapus" },
      { status: 200 }
    );
  } catch (error) {
    console.error("STAFF_DELETE_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal menghapus data", detail: error.message },
      { status: 500 }
    );
  }
}
