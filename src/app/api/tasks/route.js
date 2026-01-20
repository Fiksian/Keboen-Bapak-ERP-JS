import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET_TASKS_ERROR:", error);
    return NextResponse.json({ message: "Gagal mengambil tugas" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const newTask = await prisma.task.create({
      data: {
        title: body.title,
        time: body.time,
        priority: body.priority,
        category: body.category,
        assignee: body.assignee,
        completed: false
      }
    });
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("POST_TASK_ERROR:", error);
    return NextResponse.json({ message: "Gagal membuat tugas" }, { status: 500 });
  }
}