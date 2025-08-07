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
      isGroomer: boolean;
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

      token.isGroomer = await db.groomer
        .findUnique({
          where: { id: user.id },
          select: { active: true },
        })
        .then((g) => !!g?.active);

      return token;
    },
    async session({ session, token }) {
      if (token.role) {
        session.user.role = token.role as "USER" | "ADMIN";
      }

      if (token.userId) {
        session.user.userId = token.userId as string;
      }

      /* ---- NEW: also expose id so older code works ---- */
      if (token.userId) {
        session.user.id = token.userId as string;
      }

      if (typeof token.isGroomer === "boolean")
        session.user.isGroomer = token.isGroomer;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
