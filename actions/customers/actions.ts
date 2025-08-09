"use server";

import { auth } from "../../auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const BASE_PATH = "/admin/customers";

const DEFAULT_WORKING_HOURS = {
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
  sun: [],
};

export async function setAdminRole(userId: string, makeAdmin: boolean) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Unauthorized");

  await db.user.update({
    where: { id: userId },
    data: { role: makeAdmin ? "ADMIN" : "USER" },
  });

  revalidatePath(BASE_PATH);
}

export async function setGroomer(userId: string, makeGroomer: boolean) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Unauthorized");

  if (makeGroomer) {
    await db.groomer.upsert({
      where: { id: userId },
      update: { active: true },
      create: {
        id: userId,
        bio: null,
        specialties: [],
        workingHours: DEFAULT_WORKING_HOURS, // required JSON field
        active: true,
        autoConfirm: true,
        minLeadMinutes: 60,
        bufferMin: 0,
        emailOptIn: true,
        smsOptIn: false,
      },
    });
  } else {
    // Keep history; don't delete — just mark inactive
    await db.groomer
      .update({ where: { id: userId }, data: { active: false } })
      .catch(() => {
        /* if no record exists, ignore */
      });
  }

  revalidatePath(BASE_PATH);
}
