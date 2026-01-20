import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(request, { params }) {
  try {
    const { id } = await params; 

    await prisma.purchasing.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Item berhasil dihapus" }, { status: 200 });
  } catch (error) {
    console.error("DELETE_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal menghapus Item", detail: error.message },
      { status: 500 }
    );
  }
}