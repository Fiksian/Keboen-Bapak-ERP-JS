
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/Login",
    },
  }
);

export const config = {
  matcher: [
    "/Dashboard/:path*",
    "/Staff/:path*",
    "/Stock/:path*",
    "/Tasks/:path*",
    "/Purchasing/:path*",
    "/Notifications/:path*",
    "/Report/:path*",
    "/Cuaca/:path*",
    "/Kandang/:path*",
    "/Components/:path*",
    "/api/:path*", // Opsional: Proteksi juga API staff agar tidak bisa ditembak dari luar
  ],
};