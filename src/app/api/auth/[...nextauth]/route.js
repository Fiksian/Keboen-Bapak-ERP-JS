import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // Sesi berlaku 1 hari
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username dan password wajib diisi");
        }

        // Cari user di database DAN sertakan profil staff untuk mengambil Nama/Role terbaru
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: {
            staffProfile: true // Pastikan nama relasi ini sesuai dengan schema.prisma Anda
          }
        });

        if (!user) {
          throw new Error("Username tidak terdaftar");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Password salah");
        }

        // KIRIM DATA LENGKAP KE JWT
        return {
          id: user.id,
          name: user.staffProfile?.firstName || user.username,
          email: user.email,
          role: user.role, // Role utama dari model User
        };
      }
    })
  ],
  pages: {
    signIn: '/Login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // 1. Simpan Role ke dalam Token (Disimpan di Cookie terenkripsi)
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role; // Masukkan role ke token
        token.name = user.name;
      }
      return token;
    },
    // 2. Kirim Role dari Token ke Client-Side Session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = token.role; // Sekarang tersedia di useSession()
        session.user.name = token.name;
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };