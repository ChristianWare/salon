// src/app/(admin)/settings/page.tsx
import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import ConfirmSubmit from "@/components/shared/ConfirmSubmit/ConfirmSubmit";
import ToastBridge from "@/components/shared/ToastBridge/ToastBridge"; // ⬅️ new

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_PATH = "/admin/settings";

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

  revalidatePath(BASE_PATH);
  // ⬇️ redirect with toast flag
  redirect(`${BASE_PATH}?toast=settings_saved`);
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

  revalidatePath(BASE_PATH);
  redirect(`${BASE_PATH}?toast=template_saved`);
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
  revalidatePath(BASE_PATH);
  redirect(`${BASE_PATH}?toast=blackout_added`);
}

export async function removeBlackoutDate(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  await db.blackoutDate.delete({ where: { id } });
  revalidatePath(BASE_PATH);
  redirect(`${BASE_PATH}?toast=blackout_removed`);
}

/*───────────────────────────────────
  4️⃣ Admin Settings Page Component
────────────────────────────────────*/
type SearchParamsPromise = Promise<
  Record<string, string | string[] | undefined>
>;

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: SearchParamsPromise; // ← Next 15: async
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const spObj = await searchParams;
  const toastKeyRaw = spObj?.toast;
  const toastKey = Array.isArray(toastKeyRaw) ? toastKeyRaw[0] : toastKeyRaw;

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
      {/* Toasts */}
      <ToastBridge toastKey={toastKey} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: "1rem",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Settings</h1>
      </div>

      {/* ── General Settings ─────────────────── */}
      <section style={{ marginBottom: "1.25rem" }}>
        <h2 style={h2}>General Business Settings</h2>
        <form
          action={updateGeneralSettings}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div style={card}>
            <label style={label}>Deposit Percentage (%)</label>
            <input
              name='depositPct'
              type='number'
              step='0.1'
              defaultValue={depositCfg?.value ?? ""}
              required
              style={input}
            />
          </div>
          <div style={card}>
            <label style={label}>Cancellation Window (hrs)</label>
            <input
              name='cancelWindow'
              type='number'
              defaultValue={cancelCfg?.value ?? ""}
              required
              style={input}
            />
          </div>
          <div style={card}>
            <label style={label}>Tax Rate (%)</label>
            <input
              name='taxRate'
              type='number'
              step='0.1'
              defaultValue={taxCfg?.value ?? ""}
              required
              style={input}
            />
          </div>
          <div
            style={{ alignSelf: "stretch", display: "flex", alignItems: "end" }}
          >
            <button type='submit' style={primaryBtn}>
              Save
            </button>
          </div>
        </form>
      </section>

      {/* ── Notification Templates ───────────── */}
      <section style={{ marginBottom: "1.25rem" }}>
        <h2 style={h2}>Notification Templates</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px,1fr))",
            gap: 12,
          }}
        >
          {notificationTemplates.map((t) => (
            <form
              key={t.id}
              action={updateNotificationTemplate}
              style={{
                ...card,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <input type='hidden' name='id' value={t.id} />
              <div style={{ fontSize: 12, color: "#666" }}>
                <strong>Event:</strong> {t.event}
              </div>
              <div>
                <label style={label}>Subject</label>
                <input
                  name='subject'
                  defaultValue={t.subject}
                  required
                  style={input}
                />
              </div>
              <div>
                <label style={label}>Body</label>
                <textarea
                  name='body'
                  defaultValue={t.body}
                  rows={4}
                  required
                  style={textarea}
                />
              </div>
              <div>
                <button type='submit' style={primaryBtn}>
                  Save Template
                </button>
              </div>
            </form>
          ))}
        </div>
      </section>

      {/* ── Blackout Dates ───────────────────── */}
      <section>
        <h2 style={h2}>Blackout Dates</h2>

        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e5e5e5",
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white",
            }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                background: "#fafafa",
                zIndex: 1,
              }}
            >
              <tr>
                <th style={th}>Date</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blackoutDates.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    style={{ padding: 16, textAlign: "center", color: "#666" }}
                  >
                    No blackout dates.
                  </td>
                </tr>
              ) : (
                blackoutDates.map((b) => {
                  const delFormId = `blk-del-${b.id}`;
                  return (
                    <tr key={b.id} style={{ borderTop: "1px solid #eee" }}>
                      <td style={td}>
                        {new Date(b.date).toLocaleDateString()}
                      </td>
                      <td style={td}>
                        <ConfirmSubmit
                          form={delFormId}
                          message='Remove this blackout date?'
                        >
                          Remove
                        </ConfirmSubmit>
                        {/* hidden form */}
                        <form
                          id={delFormId}
                          action={removeBlackoutDate}
                          style={{ display: "none" }}
                        >
                          <input type='hidden' name='id' value={b.id} />
                        </form>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <form
          action={addBlackoutDate}
          style={{ display: "flex", gap: 8, alignItems: "end" }}
        >
          <div>
            <label style={label}>Add Date</label>
            <input name='date' type='date' required style={input} />
          </div>
          <button type='submit' style={primaryBtn}>
            Add Blackout Date
          </button>
        </form>
      </section>
    </section>
  );
}

/* ───────────── UI styles ───────────── */
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

const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
};

const textarea: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
  resize: "vertical",
};

const primaryBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  background: "#111",
  color: "white",
  border: "1px solid #111",
  cursor: "pointer",
};

const th: React.CSSProperties = {
  borderBottom: "1px solid #e5e5e5",
  padding: 10,
  background: "#fafafa",
  textAlign: "left",
  position: "sticky",
  top: 0,
  zIndex: 1,
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #f0f0f0",
  padding: 10,
};
