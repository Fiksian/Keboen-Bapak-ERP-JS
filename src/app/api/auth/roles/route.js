import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// GET: Mengambil semua role dan permission-nya
export async function GET() {
  try {
    const roles = await prisma.rolePermission.findMany({
      orderBy: {
        roleName: 'asc'
      }
    });
    
    const permissionMap = roles.reduce((acc, curr) => {
      acc[curr.roleName] = curr.permissions;
      return acc;
    }, {});

    return NextResponse.json(permissionMap);
  } catch (error) {
    console.error("GET_ROLES_ERROR:", error);
    return NextResponse.json({ error: "Gagal mengambil data role" }, { status: 500 });
  }
}

// POST: Membuat baru atau Memperbarui hak akses role yang sudah ada
export async function POST(req) {
  try {
    const { roleName, permissions } = await req.json();

    if (!roleName) {
      return NextResponse.json({ error: "Nama role wajib diisi" }, { status: 400 });
    }

    const updatedRole = await prisma.rolePermission.upsert({
      where: { roleName: roleName },
      update: { permissions: permissions },
      create: { 
        roleName: roleName, 
        permissions: permissions 
      },
    });

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error("POST_ROLES_ERROR:", error);
    return NextResponse.json({ error: "Gagal menyimpan data role" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const roleName = searchParams.get('roleName');

    if (!roleName) {
      return NextResponse.json({ error: "Role name diperlukan untuk menghapus" }, { status: 400 });
    }

    if (roleName === 'Owner' || roleName === 'Admin') {
      return NextResponse.json({ error: "Role sistem tidak boleh dihapus" }, { status: 403 });
    }

    await prisma.rolePermission.delete({
      where: { roleName: roleName },
    });

    return NextResponse.json({ message: `Role ${roleName} berhasil dihapus` });
  } catch (error) {
    console.error("DELETE_ROLE_ERROR:", error);
    return NextResponse.json({ error: "Gagal menghapus role" }, { status: 500 });
  }
}