// app/api/cattle/breeds/route.js
// GET    /api/cattle/breeds  — list semua breed

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const breeds = await prisma.cattleBreed.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            doItems: true,
            poItems: true,
          },
        },
      },
    });

    return NextResponse.json(breeds);
  } catch (err) {
    console.error("CATTLE_BREEDS_GET_ALL:", err.message);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}