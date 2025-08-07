// server-action
"use server";

import { auth } from "../../../../../auth";
import { db } from "@/lib/db";

export async function promoteToAdmin(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Unauthorized");

  const userId = formData.get("userId") as string;
  await db.user.update({ where: { id: userId }, data: { role: "ADMIN" } });
}
