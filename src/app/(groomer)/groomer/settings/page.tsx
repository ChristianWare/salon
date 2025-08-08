import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireGroomer } from "@/lib/rbac";
import SettingsForm from "@/components/groomerPage/SettingsForm/SettingsForm";

export const dynamic = "force-dynamic";

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

  // Numbers with sane guards
  const minLeadMinutesRaw = Number(formData.get("minLeadMinutes"));
  const bufferMinRaw = Number(formData.get("bufferMin"));
  const minLeadMinutes = Number.isFinite(minLeadMinutesRaw)
    ? Math.max(0, Math.floor(minLeadMinutesRaw))
    : 0;
  const bufferMin = Number.isFinite(bufferMinRaw)
    ? Math.max(0, Math.floor(bufferMinRaw))
    : 0;

  // Optional phone (basic trim; full E.164 validation is up to you)
  const phone =
    (formData.get("notificationPhone") as string | null)?.trim() || null;

  // If SMS is on but no phone provided, you could error. For now we allow it and the sender can validate later.
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
      <h1 style={{ marginBottom: "1rem" }}>Settings</h1>
      <p style={{ color: "#666", marginTop: 0 }}>
        Control how bookings are confirmed, lead time, cleanup buffers, and
        notification preferences.
      </p>

      <SettingsForm initial={groomer} onSave={saveSettings} />

      {/* Future: add a Stripe payout card here once Connect is wired.
         Example:
         - show onboarding status
         - “Complete payout setup” button linking to a generated onboarding URL */}
    </section>
  );
}
