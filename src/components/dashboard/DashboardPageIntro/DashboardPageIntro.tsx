import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import CancelBookingForm from "../CancelBookingForm/CancelBookingForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_PATH = "/dashboard";
const TZ = process.env.SALON_TZ ?? "America/Phoenix";

/* ───────────────── Server Action: cancel booking (kept for compatibility) ───────────────── */
export async function cancelBooking(formData: FormData) {
  "use server";
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

/* ───────────────────────── Component ───────────────────────── */
export default async function DashboardPageIntro() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const me = session.user.id;
  const name = session.user.name ?? session.user.email ?? "Your";

  const now = new Date();

  const [upcoming, statusCounts] = await db.$transaction([
    db.booking.findMany({
      where: {
        userId: me,
        start: { gte: now },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      orderBy: { start: "asc" },
      take: 5,
      include: {
        service: { select: { name: true, durationMin: true } },
        groomer: { select: { user: { select: { name: true, email: true } } } },
      },
    }),
    db.booking.groupBy({
      by: ["status"],
      where: { userId: me },
      orderBy: { status: "asc" },
      _count: { _all: true },
    }),
  ]);

  const statusMap = Object.fromEntries(
    statusCounts.map((s) => [
      String(s.status),
      typeof s._count === "object" && s._count ? (s._count._all ?? 0) : 0,
    ])
  );

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

  const next = upcoming[0];

  return (
    <section style={{ padding: "2rem" }}>
      {/* Header / Greeting */}
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
          {name}&apos;s Dashboard
        </h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href='/' style={outlineBtn}>
            Home
          </Link>
          <Link href='/booking' style={primaryBtn}>
            Book an Appointment
          </Link>
          <Link href='/account' style={outlineBtn}>
            Profile & Settings
          </Link>
          <Link href='/dashboard/my-bookings' style={outlineBtn}>
            My Bookings
          </Link>
          {session.user.role === "ADMIN" && (
            <Link href='/admin' style={outlineBtn}>
              Admin Panel
            </Link>
          )}
          {session.user.isGroomer && (
            <Link href='/groomer' style={outlineBtn}>
              Groomer Panel
            </Link>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Card
          title='Upcoming'
          value={(statusMap["CONFIRMED"] ?? 0) + (statusMap["PENDING"] ?? 0)}
        />
        <Card title='Completed' value={statusMap["COMPLETED"] ?? 0} />
        <Card title='Canceled' value={statusMap["CANCELED"] ?? 0} />
        <Card title='No-shows' value={statusMap["NO_SHOW"] ?? 0} />
      </div>

      {/* Next appointment */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {next ? "Your Next Appointment" : "No Upcoming Appointments"}
          </div>
          {next && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {/* NEW: View Details button */}
              <Link
                href={`/dashboard/my-bookings/${next.id}`}
                style={outlineBtn}
              >
                View Details
              </Link>
              <CancelBookingForm bookingId={next.id} />
            </div>
          )}
        </div>

        {next ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))",
              gap: 12,
            }}
          >
            <Info label='Date' value={dateFmt.format(new Date(next.start))} />
            <Info label='Time' value={timeFmt.format(new Date(next.start))} />
            <Info
              label='Service'
              value={`${next.service?.name ?? "—"}${next.service?.durationMin ? ` (${next.service.durationMin}m)` : ""}`}
            />
            <Info
              label='Groomer'
              value={
                next.groomer?.user?.name ?? next.groomer?.user?.email ?? "—"
              }
            />
          </div>
        ) : (
          <div style={{ color: "#666" }}>
            When you book an appointment, it will appear here.{" "}
            <Link href='/book' style={{ color: "#0969da" }}>
              Book now
            </Link>
            .
          </div>
        )}
      </div>

      {/* Upcoming list */}
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
              <th style={th}>Service</th>
              <th style={th}>Groomer</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ padding: 16, textAlign: "center", color: "#666" }}
                >
                  No upcoming bookings.
                </td>
              </tr>
            ) : (
              upcoming.map((b) => {
                const date = dateFmt.format(new Date(b.start));
                const time = timeFmt.format(new Date(b.start));
                const canCancel =
                  b.status === "PENDING" || b.status === "CONFIRMED";
                return (
                  <tr key={b.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={td}>{date}</td>
                    <td style={td}>{time}</td>
                    <td style={td}>
                      {b.service?.name ?? "—"}
                      {b.service?.durationMin ? (
                        <>
                          {" "}
                          <small>({b.service.durationMin}m)</small>
                        </>
                      ) : null}
                    </td>
                    <td style={td}>
                      {b.groomer?.user?.name ?? b.groomer?.user?.email ?? "—"}
                    </td>
                    <td style={td}>
                      <span style={pill(b.status)}>
                        {b.status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={td}>
                      <div
                        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                      >
                        {/* NEW: View button */}
                        <Link
                          href={`/dashboard/my-bookings/${b.id}`}
                          style={outlineBtnSmall}
                        >
                          View
                        </Link>
                        {canCancel ? (
                          <CancelBookingForm bookingId={b.id} />
                        ) : (
                          <span style={{ color: "#666" }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ───────────── small presentational bits ───────────── */

function Card({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function pill(status: string): React.CSSProperties {
  const color =
    status === "CONFIRMED"
      ? "#0a7"
      : status === "PENDING"
        ? "#d88a00"
        : status === "COMPLETED"
          ? "#0366d6"
          : status === "CANCELED"
            ? "#999"
            : "#b33636"; // NO_SHOW
  return {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    color: "white",
    background: color,
    fontSize: 12,
  };
}

/* ───────────── reused styles ───────────── */
const card: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 8,
  padding: 12,
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
