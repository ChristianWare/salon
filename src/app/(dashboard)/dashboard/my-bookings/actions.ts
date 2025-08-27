// src/app/(dashboard)/dashboard/my-bookings/actions.ts
"use server";

import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const BASE_PATH = "/dashboard/my-bookings";

export async function cancelBooking(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const id = formData.get("id") as string;
  const me = session.user.id;

  const booking = await db.booking.findUnique({
    where: { id },
    select: { id: true, userId: true, start: true, status: true },
  });
  if (!booking || booking.userId !== me) {
    throw new Error("Not allowed");
  }
  if (!(booking.status === "PENDING" || booking.status === "CONFIRMED")) {
    throw new Error("Only upcoming bookings can be canceled.");
  }

  // Respect cancellation window (hours) from settings; default 24h
  const cancelCfg = await db.config.findUnique({
    where: { key: "cancelWindow" },
  });
  const hours = Number(cancelCfg?.value ?? "24");
  const cutoff = new Date(booking.start);
  cutoff.setHours(cutoff.getHours() - (Number.isFinite(hours) ? hours : 24));
  if (new Date() > cutoff) {
    throw new Error("Too late to cancel online. Please contact the salon.");
  }

  await db.booking.update({
    where: { id },
    data: { status: "CANCELED" },
  });

  revalidatePath(BASE_PATH);
}
