/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/rbac.ts
import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { db } from "@/lib/db";

/**
 * Anyone logged in (Admin, Groomer, or regular user).
 * Use this for the /dashboard route group.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/**
 * Admins only.
 * If logged-in but not admin → send to /dashboard (friendly).
 * If not logged-in → requireUser() above will send to /login.
 */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

/**
 * Only accounts that are active groomers.
 * (Admins can pass here only if they are also groomers.)
 * If logged-in but not a groomer → send to /dashboard.
 */
export async function requireGroomer() {
  const user = await requireUser();

  // Prefer the session flag if present (set in your NextAuth callbacks)
  const flag = (user as any).isGroomer as boolean | undefined;
  if (flag === true) return user;
  if (flag === false) redirect("/dashboard");

  // Fallback to DB check (in case the session flag isn't populated)
  const userId = (user as any).id ?? (user as any).userId;
  if (!userId) redirect("/dashboard");

  const groomer = await db.groomer.findUnique({
    where: { id: userId },
    select: { active: true },
  });

  if (!groomer?.active) redirect("/dashboard");
  return user;
}
