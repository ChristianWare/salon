/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireGroomer } from "@/lib/rbac";
import AvailabilitySettings from "@/components/groomerPage/AvailabilitySettings/AvailabilitySettings";
import BlockedDatesEditor from "@/components/groomerPage/BlockedDatesEditor/BlockedDatesEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_PATH = "/groomer/availability";

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

  revalidatePath(BASE_PATH);
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
  await db.break.create({ data: { groomerId: user.id as string, date } });
  revalidatePath(BASE_PATH);
}

export async function removeBreak(formData: FormData) {
  "use server";
  await requireGroomer();
  const id = formData.get("id") as string;
  await db.break.delete({ where: { id } });
  revalidatePath(BASE_PATH);
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
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 12,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
          Availability
        </h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href='/groomer' style={outlineBtn}>
            Dashboard
          </Link>
          <Link href='/groomer/my-bookings' style={outlineBtn}>
            My Bookings
          </Link>
          <Link href='/groomer/earnings' style={outlineBtn}>
            Earnings
          </Link>
        </div>
      </div>

      <p style={{ marginBottom: 12, color: "#555" }}>
        Set your weekly working hours and block off full days you’re
        unavailable. Customers will only see openings inside these windows.
      </p>

      {/* Weekly availability editor */}
      <section style={{ ...card, marginBottom: 16 }}>
        <h2 style={h2}>Weekly Hours</h2>
        <AvailabilitySettings
          initialWorking={groomer.workingHours as any}
          onSave={saveWorkingHours}
        />
      </section>

      {/* Blocked dates (vacation / closed days) */}
      <section style={card}>
        <h2 style={h2}>Blocked Dates</h2>
        <BlockedDatesEditor
          initialDates={blockedDates}
          onAddBreak={addBreak}
          onRemoveBreak={removeBreak}
        />
      </section>
    </section>
  );
}

/* ───────────── inline styles ───────────── */
const h2: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  margin: "0 0 8px 0",
};
const card: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 8,
  padding: 12,
  background: "white",
};
const outlineBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  background: "white",
  color: "#333",
  border: "1px solid #ddd",
  cursor: "pointer",
  textDecoration: "none",
};
