import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; 
import { getToken } from "next-auth/jwt";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      authenticated: !!session,
      
      session_layer: {
        user: session?.user || null,
        expires: session?.expires || null,
      },

      jwt_layer: {
        exists: !!token,
        data: token || null,
      },

      check_points: {
        has_designation_in_session: !!session?.user?.designation,
        has_designation_in_jwt: !!token?.designation,
        role: session?.user?.role || "none",
      },

      instruction: "Jika 'has_designation_in_jwt' TRUE tapi 'has_designation_in_session' FALSE, periksa callback session di auth.js"
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      status: "Error",
      message: error.message
    }, { status: 500 });
  }
}