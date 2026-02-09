import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 jam
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            throw new Error("Username dan password wajib diisi");
          }

          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
            include: {
              staffs: true 
            }
          });

          if (!user) {
            throw new Error("Username tidak terdaftar");
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error("Password salah");
          }

          return {
            id: String(user.id),
            name: user.staffs?.firstName 
              ? `${user.staffs.firstName} ${user.staffs.lastName || ''}`.trim() 
              : user.username,
            email: user.email,
            role: user.role,
            designation: user.staffs?.designation || "Staff",
          };
        } catch (error) {
          console.error("AUTH_AUTHORIZE_ERROR:", error.message);
          throw new Error(error.message);
        }
      }
    })
  ],
  pages: {
    signIn: '/Login',
    error: '/Login', 
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.name = user.name;
        token.designation = user.designation;
      }
      
      if (trigger === "update" && session) {
        return { ...token, ...session.user };
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.name = token.name;
        session.user.designation = token.designation;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/Dashboard`;
    },
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  logger: {
    error(code, metadata) {
      console.error(`NEXTAUTH_ERROR: ${code}`, metadata);
    },
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };