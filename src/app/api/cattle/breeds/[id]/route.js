// app/api/cattle/breeds/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params; // ✅ await params

    const breed = await prisma.cattleBreed.findUnique({
      where: { id },
      include: {
        doItems: { take: 10 },
        poItems: { take: 10 },
        _count: { select: { doItems: true, poItems: true } },
      },
    });

    if (!breed) return NextResponse.json({ message: "Breed tidak ditemukan." }, { status: 404 });
    return NextResponse.json(breed);
  } catch (err) {
    console.error("CATTLE_BREED_GET_ID:", err.message);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!["SuperAdmin", "Admin", "Supervisor"].includes(session.user.role)) {
      return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const existingBreed = await prisma.cattleBreed.findUnique({ where: { id } });
    if (!existingBreed) return NextResponse.json({ message: "Breed tidak ditemukan." }, { status: 404 });

    const updateData = {};
    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ message: "Nama breed tidak boleh kosong." }, { status: 400 });
      updateData.name = name.toUpperCase();
      const duplicate = await prisma.cattleBreed.findFirst({
        where: { name: name.toUpperCase(), id: { not: id } },
      });
      if (duplicate) return NextResponse.json({ message: `Breed "${name}" sudah terdaftar.` }, { status: 409 });
    }
    if (description !== undefined) updateData.description = description || null;

    const updated = await prisma.cattleBreed.update({ where: { id }, data: updateData });

    await prisma.history.create({
      data: {
        action: "CATTLE_BREED_UPDATED",
        item: updated.name,
        category: "Cattle",
        type: "MASTER_DATA",
        quantity: 1,
        unit: "BREED",
        user: session.user.name || session.user.email,
        referenceId: id,
        notes: `Breed "${existingBreed.name}" → "${updated.name}".`,
      },
    });

    return NextResponse.json({ message: "Breed berhasil diupdate.", data: updated });
  } catch (err) {
    console.error("CATTLE_BREED_PATCH:", err.message);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!["SuperAdmin", "Admin"].includes(session.user.role)) {
      return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;
    const breed = await prisma.cattleBreed.findUnique({
      where: { id },
      include: { _count: { select: { doItems: true, poItems: true } } },
    });
    if (!breed) return NextResponse.json({ message: "Breed tidak ditemukan." }, { status: 404 });
    if (breed._count.doItems > 0 || breed._count.poItems > 0) {
      return NextResponse.json({
        message: `Breed "${breed.name}" tidak bisa dihapus karena sudah digunakan di ${breed._count.doItems} DO dan ${breed._count.poItems} PO.`,
      }, { status: 400 });
    }

    await prisma.cattleBreed.delete({ where: { id } });
    await prisma.history.create({
      data: {
        action: "CATTLE_BREED_DELETED",
        item: breed.name,
        category: "Cattle",
        type: "MASTER_DATA",
        quantity: 1,
        unit: "BREED",
        user: session.user.name || session.user.email,
        referenceId: id,
        notes: `Breed "${breed.name}" dihapus oleh ${session.user.name}`,
      },
    });

    return NextResponse.json({ message: `Breed "${breed.name}" berhasil dihapus.` });
  } catch (err) {
    console.error("CATTLE_BREED_DELETE_ID:", err.message);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}