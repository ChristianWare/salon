import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import authConfig from "./auth.config";
import { getUserByEmail } from "@/lib/user";

declare module "next-auth" {
  interface Session {
    user: {
      role: "USER" | "ADMIN";
      userId: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  ...authConfig,
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async jwt({ token }) {
      if (!token.email) return token;

      const user = await getUserByEmail(token.email);

      if (!user) return token;

      token.role = user.role;
      token.userId = user.id;

      return token;
    },
    async session({ session, token }) {
      if (token.role) {
        session.user.role = token.role as "USER" | "ADMIN";
      }

      if (token.userId) {
        session.user.userId = token.userID as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
