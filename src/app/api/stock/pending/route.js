import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const pendingArrivals = await prisma.purchasing.findMany({
      where: {
        status: "APPROVED",
        isReceived: false
      }
    });
    return NextResponse.json(pendingArrivals, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Gagal mengambil data antrean" }, { status: 500 });
  }
}
