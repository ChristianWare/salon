// src/lib/rbac.ts
import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { db } from "@/lib/db";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }
  return session.user;
}

export async function requireGroomer() {
  const session = await auth();
  if (!session) redirect("/login");

  const groomer = await db.groomer.findUnique({
    where: { id: session.user.id },
    select: { active: true },
  });
  if (!groomer?.active) {
    redirect("/login");
  }
  return session.user;
}
