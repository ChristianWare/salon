/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireGroomer } from "@/lib/rbac";
import AvailabilitySettings from "@/components/groomerPage/AvailabilitySettings/AvailabilitySettings";
import BlockedDatesEditor from "@/components/groomerPage/BlockedDatesEditor/BlockedDatesEditor";

/* ────────────────────────────────────────────────
   Server Action: Save working hours
──────────────────────────────────────────────── */
export async function saveWorkingHours(formData: FormData) {
  "use server";
  const user = await requireGroomer();

  const workingRaw = (formData.get("workingHours") as string) || "{}";
  let workingHours: Record<string, [string, string][]>;
  try {
    workingHours = JSON.parse(workingRaw);
  } catch {
    throw new Error("Invalid workingHours JSON");
  }

  await db.groomer.update({
    where: { id: user.id },
    data: { workingHours },
  });
}

/* ────────────────────────────────────────────────
   Server Actions: Blocked dates
──────────────────────────────────────────────── */
export async function addBreak(formData: FormData) {
  "use server";
  const user = await requireGroomer();
  const dateStr = formData.get("date") as string;
  const date = new Date(dateStr);
  if (isNaN(date.valueOf())) throw new Error("Invalid date");
  if (!user.id) throw new Error("Missing groomerId");
  await db.break.create({ data: { groomerId: user.id, date } });
}

export async function removeBreak(formData: FormData) {
  "use server";
  await requireGroomer();
  const id = formData.get("id") as string;
  await db.break.delete({ where: { id } });
}

/* ────────────────────────────────────────────────
   Page
──────────────────────────────────────────────── */
export default async function AvailabilityPage() {
  const user = await requireGroomer();

  const groomer = await db.groomer.findUnique({
    where: { id: user.id },
    include: { breaks: { orderBy: { date: "asc" } } },
  });
  if (!groomer) redirect("/login");

  const blockedDates = groomer.breaks.map((b) => ({
    id: b.id,
    date: b.date.toISOString(),
  }));

  return (
    <section style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Availability</h1>

      <p style={{ marginBottom: "1rem", color: "#555" }}>
        Set your weekly working hours and block off full days you’re
        unavailable. Customers will only see open times inside these windows.
      </p>

      {/* Weekly availability editor (Mon–Sun with start/end dropdowns) */}
      <AvailabilitySettings
        initialWorking={groomer.workingHours as any}
        onSave={saveWorkingHours}
      />

      {/* Blocked dates (vacation / closed days) */}
      <BlockedDatesEditor
        initialDates={blockedDates}
        onAddBreak={addBreak}
        onRemoveBreak={removeBreak}
      />
    </section>
  );
}
