"use server";

import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleRole(userId: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) throw new Error("Not found");

  const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
  await db.user.update({ where: { id: userId }, data: { role: newRole } });

  // make the listing re-render without a full reload
  revalidatePath("/admin/customers");
}
