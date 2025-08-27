/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireGroomer } from "@/lib/rbac";
import GroomerPageIntro from "@/components/groomerPage/GroomerPageIntro/GroomerPageIntro";
import ConfirmSubmit from "@/components/shared/ConfirmSubmit/ConfirmSubmit";
import { startOfDay, endOfDay, addDays, startOfMonth } from "date-fns";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_PATH = "/groomer";
const TZ = process.env.SALON_TZ ?? "America/Phoenix";

/*─────────────────────────────────────────────────
  1️⃣ Server Action: Update Profile
──────────────────────────────────────────────────*/
export async function updateProfile(formData: FormData) {
  "use server";
  const user = await requireGroomer();

  const bio = (formData.get("bio") as string)?.trim() || "";
  const specsRaw = (formData.get("specialties") as string) || "";
  const workingRaw = (formData.get("workingHours") as string) || "{}";

  let workingHours: Record<string, [string, string][]>;
  try {
    workingHours = JSON.parse(workingRaw);
  } catch {
    throw new Error("Invalid workingHours JSON");
  }

  await db.groomer.update({
    where: { id: user.id },
    data: {
      bio,
      specialties: specsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      workingHours,
    },
  });

  revalidatePath(BASE_PATH);
}

/*─────────────────────────────────────────────────
  2️⃣ Server Action: Add Break Date
──────────────────────────────────────────────────*/
export async function addBreak(formData: FormData) {
  "use server";
  const user = await requireGroomer();

  const dateStr = formData.get("date") as string;
  const date = new Date(dateStr);
  if (isNaN(date.valueOf())) throw new Error("Invalid date");

  if (!user.id) throw new Error("Missing groomerId");
  await db.break.create({
    data: { groomerId: user.id, date },
  });

  revalidatePath(BASE_PATH);
}

/*─────────────────────────────────────────────────
  3️⃣ Server Action: Remove Break Date
──────────────────────────────────────────────────*/
export async function removeBreak(formData: FormData) {
  "use server";
  await requireGroomer();

  const id = formData.get("id") as string;
  await db.break.delete({ where: { id } });

  revalidatePath(BASE_PATH);
}

/*─────────────────────────────────────────────────
  4️⃣ Groomer Dashboard Page
──────────────────────────────────────────────────*/
export default async function GroomerDashboardPage() {
  const user = await requireGroomer();

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const weekEnd = endOfDay(addDays(todayStart, 7));
  const monthStart = startOfMonth(new Date());

  const groomer = await db.groomer.findUnique({
    where: { id: user.id },
    include: { breaks: { orderBy: { date: "asc" } } },
  });
  if (!groomer) redirect("/login");

  const [
    appointmentsToday,
    appointmentsWeek,
    earningsTodayAgg,
    earningsMTDAgg,
    pendingCount,
    nextBookings,
  ] = await Promise.all([
    // confirmed appointments today
    db.booking.count({
      where: {
        groomerId: user.id,
        status: "CONFIRMED",
        start: { gte: todayStart, lte: todayEnd },
      },
    }),
    // confirmed appointments next 7 days
    db.booking.count({
      where: {
        groomerId: user.id,
        status: "CONFIRMED",
        start: { gte: todayStart, lte: weekEnd },
      },
    }),
    // earnings from completed appointments today
    db.booking.aggregate({
      _sum: { depositCents: true, tipCents: true },
      where: {
        groomerId: user.id,
        status: "COMPLETED",
        start: { gte: todayStart, lte: todayEnd },
      },
    }),
    // earnings from completed appointments month-to-date
    db.booking.aggregate({
      _sum: { depositCents: true, tipCents: true },
      where: {
        groomerId: user.id,
        status: "COMPLETED",
        start: { gte: monthStart },
      },
    }),
    // new (pending) booking requests
    db.booking.count({
      where: {
        groomerId: user.id,
        status: "PENDING",
        start: { gte: todayStart },
      },
    }),
    // next 5 upcoming bookings (any status that is upcoming)
    db.booking.findMany({
      where: {
        groomerId: user.id,
        start: { gte: new Date() },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: {
        id: true,
        start: true,
        createdAt: true,
        status: true,
        service: { select: { name: true, durationMin: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { start: "asc" },
      take: 5,
    }),
  ]);

  // convert cents → dollars
  const centsToDollars = (c: number | null | undefined) => (c ?? 0) / 100;
  const earningsToday =
    centsToDollars(earningsTodayAgg._sum.depositCents) +
    centsToDollars(earningsTodayAgg._sum.tipCents);
  const earningsMTD =
    centsToDollars(earningsMTDAgg._sum.depositCents) +
    centsToDollars(earningsMTDAgg._sum.tipCents);

  const dateFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const timeFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section style={{ padding: "2rem" }}>
      {/* Intro */}
      <div style={{ marginBottom: 12 }}>
        <GroomerPageIntro />
      </div>

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <KpiCard label='Today’s Appointments' value={appointmentsToday} />
        <KpiCard label='Next 7 Days' value={appointmentsWeek} />
        <KpiCard
          label='Earnings Today'
          value={`$${earningsToday.toFixed(2)}`}
        />
        <KpiCard
          label='Earnings This Month'
          value={`$${earningsMTD.toFixed(2)}`}
        />
      </div>

      {/* Pending alert */}
      {pendingCount > 0 && (
        <div
          style={{
            ...card,
            borderColor: "#f3d1d1",
            background: "#fff5f5",
            color: "#b33636",
            marginBottom: 16,
          }}
        >
          You have{" "}
          <Link
            href='/groomer/my-bookings?filter=pending'
            style={{ color: "#b33636", textDecoration: "underline" }}
          >
            {pendingCount} new booking request{pendingCount > 1 ? "s" : ""}
          </Link>
          .
        </div>
      )}

      {/* Upcoming appointments */}
      <section style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <h2 style={h2}>Next Appointments</h2>
          <Link href='/groomer/my-bookings' style={outlineBtn}>
            View all
          </Link>
        </div>

        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e5e5e5",
            borderRadius: 8,
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
                <th style={th}>Time</th>
                <th style={th}>Booked</th>
                <th style={th}>Customer</th>
                <th style={th}>Service</th>
                <th style={th}>Status</th>
                {/* NEW: Actions column */}
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {nextBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ padding: 16, textAlign: "center", color: "#666" }}
                  >
                    You have no upcoming appointments.
                  </td>
                </tr>
              ) : (
                nextBookings.map((b) => {
                  return (
                    <tr key={b.id} style={{ borderTop: "1px solid #eee" }}>
                      <td style={td}>{dateFmt.format(new Date(b.start))}</td>
                      <td style={td}>{timeFmt.format(new Date(b.start))}</td>
                      <td style={td}>
                        {dateFmt.format(new Date(b.createdAt))}{" "}
                        <small style={{ color: "#666" }}>
                          {timeFmt.format(new Date(b.createdAt))}
                        </small>
                      </td>
                      <td style={td}>{b.user?.name ?? "—"}</td>
                      <td style={td}>
                        {b.service?.name ?? "—"}
                        {b.service?.durationMin ? (
                          <small> ({b.service.durationMin}m)</small>
                        ) : null}
                      </td>
                      <td style={td}>
                        <span style={statusPill(b.status as any)}>
                          {b.status}
                        </span>
                      </td>
                      {/* NEW: View button to details page */}
                      <td style={td}>
                        <Link
                          href={`/groomer/my-bookings/${b.id}`}
                          style={outlineBtnSmall}
                          title='View booking details'
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Actions */}
      <section style={{ marginBottom: 16 }}>
        <h2 style={h2}>Quick Actions</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Link href='/groomer/availability' style={outlineBtn}>
            Manage Availability
          </Link>
          <Link href='/groomer/profile' style={outlineBtn}>
            Edit Profile
          </Link>
          <Link href='/groomer/my-bookings' style={outlineBtn}>
            View All Bookings
          </Link>
          <Link href='/groomer/earnings' style={outlineBtn}>
            View Earnings
          </Link>
        </div>
      </section>

      {/* Breaks manager */}
      <section>
        <h2 style={h2}>Breaks / Time Off</h2>

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
              {groomer.breaks.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    style={{ padding: 16, textAlign: "center", color: "#666" }}
                  >
                    No breaks scheduled.
                  </td>
                </tr>
              ) : (
                groomer.breaks.map((br) => {
                  const delId = `break-del-${br.id}`;
                  return (
                    <tr key={br.id} style={{ borderTop: "1px solid #eee" }}>
                      <td style={td}>{dateFmt.format(new Date(br.date))}</td>
                      <td style={td}>
                        <ConfirmSubmit
                          form={delId}
                          message='Remove this break date?'
                        >
                          Remove
                        </ConfirmSubmit>
                        <form
                          id={delId}
                          action={removeBreak}
                          style={{ display: "none" }}
                        >
                          <input type='hidden' name='id' value={br.id} />
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
          action={addBreak}
          style={{ display: "flex", gap: 8, alignItems: "end" }}
        >
          <div>
            <label style={label}>Add Break Date</label>
            <input type='date' name='date' required style={input} />
          </div>
          <button type='submit' style={primaryBtn}>
            Add
          </button>
        </form>
      </section>
    </section>
  );
}

/* ───────────── UI helpers ───────────── */
function KpiCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function statusPill(
  status: "CONFIRMED" | "PENDING" | "COMPLETED" | "CANCELED" | "NO_SHOW"
): React.CSSProperties {
  const color =
    status === "CONFIRMED"
      ? "#0a7"
      : status === "PENDING"
        ? "#d88a00"
        : status === "COMPLETED"
          ? "#0366d6"
          : status === "CANCELED"
            ? "#999"
            : "#b33636";
  return {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    color: "white",
    background: color,
    fontSize: 12,
  };
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
const label: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#666",
  marginBottom: 4,
};
const input: React.CSSProperties = {
  width: 200,
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
/* NEW: smaller outline button for table actions */
const outlineBtnSmall: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  background: "white",
  color: "#333",
  border: "1px solid #ddd",
  cursor: "pointer",
  textDecoration: "none",
  fontSize: 13,
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
