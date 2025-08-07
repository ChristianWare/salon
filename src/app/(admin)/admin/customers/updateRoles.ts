// src/app/(admin)/customers/updateRoles.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "../../../../../auth";
import { revalidatePath } from "next/cache";

export async function updateRoles(
  userId: string,
  makeAdmin: boolean,
  makeGroomer: boolean
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Unauthorized");

  /*── guard: at least one admin must remain ──*/
  if (!makeAdmin) {
    const adminCount = await db.user.count({ where: { role: "ADMIN" } });
    const thisUser = await db.user.findUnique({ where: { id: userId } });
    if (thisUser?.role === "ADMIN" && adminCount === 1) {
      throw new Error("You must keep at least one admin.");
    }
  }

  /*── USER.role column ──*/
  await db.user.update({
    where: { id: userId },
    data: { role: makeAdmin ? "ADMIN" : "USER" },
  });

  /*── Groomer table: toggle “active” instead of delete ──*/
  const existing = await db.groomer.findUnique({ where: { id: userId } });

  if (makeGroomer) {
    if (existing) {
      await db.groomer.update({
        where: { id: userId },
        data: { active: true },
      });
    } else {
      await db.groomer.create({
        data: {
          id: userId,
          bio: "",
          specialties: [],
          workingHours: {},
          active: true,
        },
      });
    }
  } else if (existing) {
    await db.groomer.update({ where: { id: userId }, data: { active: false } });
  }

  revalidatePath("/admin/customers"); // instant SSR refresh
}
