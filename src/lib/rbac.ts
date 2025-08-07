import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { db } from "@/lib/db";

export async function requireGroomer() {
  const session = await auth();
  if (!session) redirect("/login");

  const groomer = await db.groomer.findUnique({
    where: { id: session.user.id },
    select: { active: true },
  });
  if (!groomer?.active) redirect("/login");

  return session.user;
}
