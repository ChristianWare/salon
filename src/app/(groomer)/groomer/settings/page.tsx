// src/app/groomer/settings/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireGroomer } from "@/lib/rbac";
import SettingsForm from "@/components/groomerPage/SettingsForm/SettingsForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_PATH = "/groomer/settings";

/* ────────────────────────────────────────────────
   Server Action: Save settings
──────────────────────────────────────────────── */
export async function saveSettings(formData: FormData) {
  "use server";
  const user = await requireGroomer();

  // Booleans from checkboxes
  const autoConfirm = formData.get("autoConfirm") === "on";
  const emailOptIn = formData.get("emailOptIn") === "on";
  const smsOptIn = formData.get("smsOptIn") === "on";

  // Numbers with guards
  const minLeadMinutesRaw = Number(formData.get("minLeadMinutes"));
  const bufferMinRaw = Number(formData.get("bufferMin"));
  const minLeadMinutes = Number.isFinite(minLeadMinutesRaw)
    ? Math.max(0, Math.floor(minLeadMinutesRaw))
    : 0;
  const bufferMin = Number.isFinite(bufferMinRaw)
    ? Math.max(0, Math.floor(bufferMinRaw))
    : 0;

  // Optional phone
  const phone =
    (formData.get("notificationPhone") as string | null)?.trim() || null;

  await db.groomer.update({
    where: { id: user.id },
    data: {
      autoConfirm,
      emailOptIn,
      smsOptIn,
      notificationPhone: smsOptIn ? phone : null,
      minLeadMinutes,
      bufferMin,
    },
  });

  // instant SSR refresh
  revalidatePath(BASE_PATH);
}

/* ────────────────────────────────────────────────
   Page
──────────────────────────────────────────────── */
export default async function SettingsPage() {
  const user = await requireGroomer();

  const groomer = await db.groomer.findUnique({
    where: { id: user.id },
    select: {
      autoConfirm: true,
      minLeadMinutes: true,
      bufferMin: true,
      emailOptIn: true,
      smsOptIn: true,
      notificationPhone: true,
    },
  });

  if (!groomer) redirect("/login");

  return (
    <section style={{ padding: "2rem", maxWidth: 760 }}>
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
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Settings</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href='/groomer' style={outlineBtn}>
            Dashboard
          </Link>
          <Link href='/groomer/availability' style={outlineBtn}>
            Availability
          </Link>
          <Link href='/groomer/my-bookings' style={outlineBtn}>
            My Bookings
          </Link>
        </div>
      </div>

      <p style={{ color: "#666", marginTop: 0, marginBottom: 12 }}>
        Control how bookings are confirmed, lead time, cleanup buffers, and
        notification preferences.
      </p>

      {/* Form card */}
      <section style={card}>
        <h2 style={h2}>Booking & Notifications</h2>
        <SettingsForm initial={groomer} onSave={saveSettings} />
      </section>

      {/* Future: Stripe Connect / payouts can go here as another card */}
    </section>
  );
}

/* ───────────── shared inline styles ───────────── */
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
