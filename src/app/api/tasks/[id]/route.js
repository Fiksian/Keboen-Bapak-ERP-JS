import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// UPDATE & TOGGLE STATUS
export async function PATCH(request, context) {
  try {
    const { id } = await context.params; // Sesuai standar Next.js terbaru
    const body = await request.json();

    const updatedTask = await prisma.task.update({
      where: { id: id },
      data: {
        // Mendukung update parsial (hanya field yang dikirim yang diubah)
        ...(body.title && { title: body.title }),
        ...(body.time && { time: body.time }),
        ...(body.priority && { priority: body.priority }),
        ...(body.category && { category: body.category }),
        ...(body.assignee && { assignee: body.assignee }),
        ...(typeof body.completed === 'boolean' && { completed: body.completed }),
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("PATCH_TASK_ERROR:", error);
    return NextResponse.json({ message: "Gagal memperbarui tugas" }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const { id } = await context.params;

    await prisma.task.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: "Tugas berhasil dihapus" });
  } catch (error) {
    console.error("DELETE_TASK_ERROR:", error);
    return NextResponse.json({ message: "Gagal menghapus tugas" }, { status: 500 });
  }
}