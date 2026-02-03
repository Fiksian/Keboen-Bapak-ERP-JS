import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const staff = await prisma.staffs.findUnique({
      where: { email: session.user.email }
    });

    if (!staff) return NextResponse.json({ message: "Profile not found" }, { status: 404 });

    return NextResponse.json(staff);
  } catch (error) {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}