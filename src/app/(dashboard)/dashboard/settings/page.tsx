import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import ConfirmSubmit from "@/components/shared/ConfirmSubmit/ConfirmSubmit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_PATH = "/dashboard/settings";

/* ───────────────── Actions ───────────────── */

export async function updateGroomerNotifications(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const emailOptIn = formData.get("emailOptIn") === "on";
  const smsOptIn = formData.get("smsOptIn") === "on";
  const notificationPhone =
    (formData.get("notificationPhone") as string)?.trim() || null;

  // Only update if the user is a groomer
  const groomer = await db.groomer.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!groomer)
    throw new Error("Only groomers can edit notification preferences.");

  if (smsOptIn && !notificationPhone) {
    throw new Error("Please enter a phone number to enable SMS notifications.");
  }

  await db.groomer.update({
    where: { id: session.user.id },
    data: { emailOptIn, smsOptIn, notificationPhone },
  });

  revalidatePath(BASE_PATH);
}

export async function signOutEverywhere() {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await db.session.deleteMany({ where: { userId: session.user.id } });
  redirect("/login");
}

export async function deleteAccount() {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Block deletion if there are upcoming bookings
  const upcoming = await db.booking.count({
    where: {
      userId: session.user.id,
      start: { gte: new Date() },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });
  if (upcoming > 0) {
    throw new Error("You have upcoming bookings. Please cancel them first.");
  }

  // This will cascade delete sessions/accounts/bookings per your schema
  await db.user.delete({ where: { id: session.user.id } });
  redirect("/");
}

/* ───────────────── Page ───────────────── */

export default async function SettingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [me, groomer] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    db.groomer.findUnique({
      where: { id: session.user.id },
      select: {
        active: true,
        emailOptIn: true,
        smsOptIn: true,
        notificationPhone: true,
      },
    }),
  ]);

  if (!me) redirect("/login");

  const joined = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(me.createdAt));

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
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Settings</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href='/dashboard' style={outlineBtn}>
            Dashboard
          </Link>
          <Link href='/dashboard/bookings' style={outlineBtn}>
            My Bookings
          </Link>
          <Link href='/book' style={primaryBtn}>
            Book Appointment
          </Link>
        </div>
      </div>

      {/* Account summary */}
      <div
        style={{
          ...card,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Info label='Name' value={me.name ?? "—"} />
        <Info label='Email' value={me.email} />
        <Info label='Role' value={me.role} />
        <Info label='Joined' value={joined} />
      </div>

      {/* Notifications (groomer only) */}
      {groomer?.active && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={h2}>Notifications (Groomers)</h2>
          <form
            action={updateGroomerNotifications}
            style={{
              ...card,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <label style={label}>Email Notifications</label>
              <label style={checkboxLabel}>
                <input
                  type='checkbox'
                  name='emailOptIn'
                  defaultChecked={!!groomer.emailOptIn}
                />{" "}
                &nbsp;Receive job notifications by email
              </label>
            </div>
            <div>
              <label style={label}>SMS Notifications</label>
              <label style={checkboxLabel}>
                <input
                  type='checkbox'
                  name='smsOptIn'
                  defaultChecked={!!groomer.smsOptIn}
                />{" "}
                &nbsp;Receive job notifications by SMS
              </label>
            </div>
            <div>
              <label style={label}>Notification Phone</label>
              <input
                name='notificationPhone'
                defaultValue={groomer.notificationPhone ?? ""}
                placeholder='(555) 123-4567'
                style={input}
              />
              <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                Required if SMS is enabled.
              </div>
            </div>
            <div
              style={{
                alignSelf: "stretch",
                display: "flex",
                alignItems: "end",
              }}
            >
              <button type='submit' style={primaryBtn}>
                Save
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Security */}
      <section>
        <h2 style={h2}>Security</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))",
            gap: 12,
          }}
        >
          {/* Sign out everywhere */}
          <form action={signOutEverywhere} style={card}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              Sign out everywhere
            </div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
              End all active sessions on all devices. You’ll need to log in
              again.
            </div>
            <button type='submit' style={outlineBtn}>
              Sign out all devices
            </button>
          </form>

          {/* Danger Zone: Delete account */}
          <div style={card}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: "#b33636" }}>
              Delete account
            </div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
              Permanently delete your account and data (past bookings are
              removed). This cannot be undone.
            </div>
            <form
              id='del-account'
              action={deleteAccount}
              style={{ display: "none" }}
            />
            <ConfirmSubmit
              form='del-account'
              message='Are you sure you want to permanently delete your account? This cannot be undone.'
            >
              Delete my account
            </ConfirmSubmit>
          </div>
        </div>
      </section>
    </section>
  );
}

/* ───────────── UI bits ───────────── */

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontWeight: 500, wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

/* ───────────── styles ───────────── */
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

const label: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#666",
  marginBottom: 4,
};

const checkboxLabel: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 10px",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
};

const primaryBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  background: "#111",
  color: "white",
  border: "1px solid #111",
  cursor: "pointer",
  textDecoration: "none",
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
