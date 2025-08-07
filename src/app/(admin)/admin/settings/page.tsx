// src/app/(admin)/settings/page.tsx
import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";

/*───────────────────────────────────
  1️⃣ Server Action: General Settings
────────────────────────────────────*/
export async function updateGeneralSettings(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Unauthorized");

  const depositPct = parseFloat(formData.get("depositPct") as string);
  const cancelWindow = parseInt(formData.get("cancelWindow") as string, 10);
  const taxRate = parseFloat(formData.get("taxRate") as string);

  if (isNaN(depositPct) || isNaN(cancelWindow) || isNaN(taxRate)) {
    throw new Error("Invalid input");
  }

  // Upsert each config key
  await Promise.all([
    db.config.upsert({
      where: { key: "depositPct" },
      create: { key: "depositPct", value: depositPct.toString() },
      update: { value: depositPct.toString() },
    }),
    db.config.upsert({
      where: { key: "cancelWindow" },
      create: { key: "cancelWindow", value: cancelWindow.toString() },
      update: { value: cancelWindow.toString() },
    }),
    db.config.upsert({
      where: { key: "taxRate" },
      create: { key: "taxRate", value: taxRate.toString() },
      update: { value: taxRate.toString() },
    }),
  ]);
}

/*───────────────────────────────────
  2️⃣ Server Action: Notification 
────────────────────────────────────*/
export async function updateNotificationTemplate(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const subject = (formData.get("subject") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  if (!id || !subject || !body) throw new Error("Invalid input");

  await db.notificationTemplate.update({
    where: { id },
    data: { subject, body },
  });
}

/*───────────────────────────────────
  3️⃣ Server Action: Blackout Dates
────────────────────────────────────*/
export async function addBlackoutDate(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Unauthorized");

  const dateStr = formData.get("date") as string;
  const date = new Date(dateStr);
  if (isNaN(date.valueOf())) throw new Error("Invalid date");

  await db.blackoutDate.create({ data: { date } });
}

export async function removeBlackoutDate(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  await db.blackoutDate.delete({ where: { id } });
}

/*───────────────────────────────────
  4️⃣ Admin Settings Page Component
────────────────────────────────────*/
export default async function AdminSettingsPage() {
  // Guard
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  // Fetch current settings
  const [depositCfg, cancelCfg, taxCfg] = await Promise.all([
    db.config.findUnique({ where: { key: "depositPct" } }),
    db.config.findUnique({ where: { key: "cancelWindow" } }),
    db.config.findUnique({ where: { key: "taxRate" } }),
  ]);
  const notificationTemplates = await db.notificationTemplate.findMany({
    orderBy: { event: "asc" },
  });
  const blackoutDates = await db.blackoutDate.findMany({
    orderBy: { date: "asc" },
  });

  return (
    <section style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Settings</h1>

      {/* ── General Settings ─────────────────── */}
      <section style={{ marginBottom: "2rem" }}>
        <h2>General Business Settings</h2>
        <form action={updateGeneralSettings}>
          <label>
            Deposit Percentage (%):
            <input
              name='depositPct'
              type='number'
              step='0.1'
              defaultValue={depositCfg?.value ?? ""}
              required
            />
          </label>
          &nbsp;&nbsp;
          <label>
            Cancellation Window (hrs):
            <input
              name='cancelWindow'
              type='number'
              defaultValue={cancelCfg?.value ?? ""}
              required
            />
          </label>
          &nbsp;&nbsp;
          <label>
            Tax Rate (%):
            <input
              name='taxRate'
              type='number'
              step='0.1'
              defaultValue={taxCfg?.value ?? ""}
              required
            />
          </label>
          &nbsp;
          <button type='submit'>Save</button>
        </form>
      </section>

      {/* ── Notification Templates ───────────── */}
      <section style={{ marginBottom: "2rem" }}>
        <h2>Notification Templates</h2>
        {notificationTemplates.map((t) => (
          <form
            key={t.id}
            action={updateNotificationTemplate}
            style={{
              border: "1px solid #ddd",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <input type='hidden' name='id' value={t.id} />
            <p>
              <strong>Event:</strong> {t.event}
            </p>
            <label>
              Subject:
              <input name='subject' defaultValue={t.subject} required />
            </label>
            <br />
            <label>
              Body:
              <textarea name='body' defaultValue={t.body} rows={3} required />
            </label>
            <br />
            <button type='submit'>Save Template</button>
          </form>
        ))}
      </section>

      {/* ── Blackout Dates ───────────────────── */}
      <section>
        <h2>Blackout Dates</h2>
        <ul>
          {blackoutDates.map((b) => (
            <li key={b.id} style={{ marginBottom: "0.5rem" }}>
              {new Date(b.date).toLocaleDateString()}
              &nbsp;
              <form action={removeBlackoutDate} style={{ display: "inline" }}>
                <input type='hidden' name='id' value={b.id} />
                <button type='submit'>Remove</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addBlackoutDate}>
          <input name='date' type='date' required />
          &nbsp;
          <button type='submit'>Add Blackout Date</button>
        </form>
      </section>
    </section>
  );
}
