// app/(admin)/admin/bookings/_actions.ts
"use server";

import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");
}

export async function cancelBookingSA(id: string, reason?: string) {
  await requireAdmin();
  const existing = await db.booking.findUnique({
    where: { id },
    select: { status: true, notes: true },
  });
  if (!existing) return { ok: false, error: "Booking not found" };
  if (existing.status === "CANCELED")
    return { ok: false, error: "Already canceled" };

  const prefix = reason?.trim()
    ? `Canceled by admin — ${reason.trim().slice(0, 500)}`
    : "Canceled by admin";
  const newNotes = existing.notes ? `${existing.notes}\n${prefix}` : prefix;

  await db.booking.update({
    where: { id },
    data: { status: "CANCELED", notes: newNotes },
  });

  return { ok: true };
}

export async function markCompletedSA(id: string) {
  await requireAdmin();
  await db.booking.update({ where: { id }, data: { status: "COMPLETED" } });
  return { ok: true };
}

export async function markNoShowSA(id: string) {
  await requireAdmin();
  await db.booking.update({ where: { id }, data: { status: "NO_SHOW" } });
  return { ok: true };
}
