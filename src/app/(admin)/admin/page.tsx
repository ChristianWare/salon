/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(admin)/page.tsx
import styles from "./AdminPage.module.css";
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { db } from "@/lib/db";
import AdminPageIntro from "@/components/admin/AdminPageIntro/AdminPageIntro";
import AdminKpiCard from "@/components/admin/AdminKpiCard/AdminKpiCard";
import Button from "@/components/shared/Button/Button";
import { startOfDay, endOfDay, startOfMonth } from "date-fns";

export default async function AdminPage() {
  // 1) Enforce ADMIN only
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // 2) Date boundaries
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);

  // 3) KPIs
  const [
    bookingsToday,
    revenueAgg,
    totalBookings,
    totalUsers,
    pendingBookings,
    activeGroomers,
    activeServices,
  ] = await db.$transaction([
    // Bookings that start today
    db.booking.count({
      where: { start: { gte: todayStart, lte: todayEnd } },
    }),
    // Sum of deposits+tips month-to-date
    db.booking.aggregate({
      _sum: { depositCents: true, tipCents: true },
      where: { start: { gte: monthStart } },
    }),
    // All-time
    db.booking.count(),
    // Registered users
    db.user.count({ where: { role: "USER" } }),
    // Bookings waiting (future). You might have old data using PENDING.
    db.booking.count({
      where: {
        status: "PENDING",
        start: { gte: now },
      },
    }),
    // Active groomers
    db.groomer.count({ where: { active: true } }),
    // Active services
    db.service.count({ where: { active: true } }),
  ]);

  const revenueThisMonth =
    ((revenueAgg._sum.depositCents ?? 0) + (revenueAgg._sum.tipCents ?? 0)) /
    100;

  // 4) Tables (plain data lists)
  // Today’s schedule (next up to 10)
  const todaysBookings = await db.booking.findMany({
    where: { start: { gte: todayStart, lte: todayEnd } },
    include: {
      service: { select: { name: true, durationMin: true } },
      user: { select: { name: true, email: true } },
      groomer: { select: { user: { select: { name: true } } } },
    },
    orderBy: { start: "asc" },
    take: 10,
  });

  // Pending approvals (if any exist; otherwise it’ll be an empty list)
  const pendingList = await db.booking.findMany({
    where: { status: "PENDING", start: { gte: now } },
    include: {
      service: { select: { name: true } },
      user: { select: { name: true, email: true } },
      groomer: { select: { user: { select: { name: true } } } },
    },
    orderBy: { start: "asc" },
    take: 10,
  });

  // Groomers needing attention:
  // - inactive OR no working hours on any day
  const groomersNeedingAttention = await db.groomer.findMany({
    where: {
      OR: [
        { active: false },
        // "no working hours": any day array is empty or workingHours is missing
        // We'll filter in JS since JSON structure can vary.
      ],
    },
    include: { user: { select: { name: true, email: true } } },
    take: 50,
  });

  // Include also active groomers with empty workingHours
  const groomersAll = await db.groomer.findMany({
    include: { user: { select: { name: true, email: true } } },
  });
  const needsHours = groomersAll.filter((g) => {
    const wh = (g.workingHours as any) || {};
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const hasAny =
      typeof wh === "object" &&
      days.some((d) => Array.isArray(wh[d]) && wh[d].length > 0);
    return !hasAny;
  });

  // Merge and uniq by id
  const mapById = new Map<string, (typeof groomersAll)[number]>();
  [...groomersNeedingAttention, ...needsHours].forEach((g) =>
    mapById.set(g.id, g)
  );
  const attentionList = Array.from(mapById.values()).slice(0, 10);

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <AdminPageIntro />
      </div>

      <div className={styles.bottom}>
        <h2 className={styles.heading}>Analytics</h2>

        {/* KPI Row 1 */}
        <div className={styles.kpiCards}>
          <AdminKpiCard label='Bookings Today' value={bookingsToday} />
          <AdminKpiCard
            label='Revenue This Month'
            value={`$${revenueThisMonth.toFixed(2)}`}
          />
          <AdminKpiCard label='Total Bookings' value={totalBookings} />
          <AdminKpiCard label='Registered Users' value={totalUsers} />
        </div>

        {/* KPI Row 2 (optional but useful) */}
        <div className={styles.kpiCards} style={{ marginTop: 12 }}>
          <AdminKpiCard label='Pending Bookings' value={pendingBookings} />
          <AdminKpiCard label='Active Groomers' value={activeGroomers} />
          <AdminKpiCard label='Active Services' value={activeServices} />
        </div>

        <h2 className={styles.heading}>Today’s Schedule</h2>
        <div style={{ overflowX: "auto", marginBottom: 24 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <TH>Time</TH>
                <TH>Service</TH>
                <TH>Customer</TH>
                <TH>Groomer</TH>
                <TH>Status</TH>
              </tr>
            </thead>
            <tbody>
              {todaysBookings.length === 0 ? (
                <tr>
                  <TD colSpan={5} style={{ textAlign: "center" }}>
                    No bookings today.
                  </TD>
                </tr>
              ) : (
                todaysBookings.map((b) => {
                  const t = new Date(b.start);
                  const timeStr = t.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <tr key={b.id}>
                      <TD>{timeStr}</TD>
                      <TD>
                        {b.service.name}{" "}
                        <small>({b.service.durationMin}m)</small>
                      </TD>
                      <TD>
                        {b.user.name ?? "—"}
                        <br />
                        <small>{b.user.email}</small>
                      </TD>
                      <TD>{b.groomer.user?.name ?? "—"}</TD>
                      <TD>
                        <StatusBadge status={b.status} />
                      </TD>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Only render Pending Approvals section if you still have some in DB */}
        {pendingBookings > 0 && (
          <>
            <h2 className={styles.heading}>Pending Approvals</h2>
            <div style={{ overflowX: "auto", marginBottom: 24 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <TH>Date</TH>
                    <TH>Time</TH>
                    <TH>Service</TH>
                    <TH>Customer</TH>
                    <TH>Groomer</TH>
                  </tr>
                </thead>
                <tbody>
                  {pendingList.length === 0 ? (
                    <tr>
                      <TD colSpan={5} style={{ textAlign: "center" }}>
                        All clear.
                      </TD>
                    </tr>
                  ) : (
                    pendingList.map((b) => {
                      const d = new Date(b.start);
                      const dateStr = d.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                      const timeStr = d.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <tr key={b.id}>
                          <TD>{dateStr}</TD>
                          <TD>{timeStr}</TD>
                          <TD>{b.service.name}</TD>
                          <TD>
                            {b.user.name ?? "—"}
                            <br />
                            <small>{b.user.email}</small>
                          </TD>
                          <TD>{b.groomer.user?.name ?? "—"}</TD>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        <h2 className={styles.heading}>Attention Needed</h2>
        <div style={{ overflowX: "auto", marginBottom: 24 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <TH>Groomer</TH>
                <TH>Email</TH>
                <TH>Active</TH>
                <TH>Has Working Hours</TH>
                <TH>Action</TH>
              </tr>
            </thead>
            <tbody>
              {attentionList.length === 0 ? (
                <tr>
                  <TD colSpan={5} style={{ textAlign: "center" }}>
                    Nothing needs attention.
                  </TD>
                </tr>
              ) : (
                attentionList.map((g) => {
                  const wh = (g.workingHours as any) || {};
                  const days = [
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                    "Sun",
                  ];
                  const hasAny =
                    typeof wh === "object" &&
                    days.some((d) => Array.isArray(wh[d]) && wh[d].length > 0);
                  return (
                    <tr key={g.id}>
                      <TD>{g.user?.name ?? "—"}</TD>
                      <TD>
                        <small>{g.user?.email ?? "—"}</small>
                      </TD>
                      <TD>{g.active ? "Yes" : "No"}</TD>
                      <TD>{hasAny ? "Yes" : "No"}</TD>
                      <TD>
                        <div
                          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                        >
                          <Button
                            href={`/admin/groomers/${g.id}`}
                            btnType='blueOutline'
                            text='View Groomer'
                          />
                          <Button
                            href='/groomer/availability'
                            btnType='blueOutline'
                            text='Set Hours'
                          />
                        </div>
                      </TD>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <h2 className={styles.heading}>Quick Links</h2>
        <div className={styles.quickLinks}>
          <Button
            href='/admin/groomers'
            text='Add Groomer'
            btnType='blueOutline'
            plus
          />
          <Button
            href='/admin/services'
            text='Add Service'
            btnType='blueOutline'
            plus
          />
          <Button
            href='/admin/bookings'
            text='View Bookings'
            btnType='blueOutline'
          />
          <Button
            href='/admin/customers'
            text='View Customers'
            btnType='blueOutline'
          />
        </div>
      </div>
    </div>
  );
}

/* tiny cell helpers so you don't repeat inline styles */
function TH({ children }: { children: React.ReactNode }) {
  return <th style={th}>{children}</th>;
}
function TD({
  children,
  colSpan,
  style,
}: {
  children: React.ReactNode;
  colSpan?: number;
  style?: React.CSSProperties;
}) {
  return (
    <td colSpan={colSpan} style={{ ...td, ...(style || {}) }}>
      {children}
    </td>
  );
}

function StatusBadge({ status }: { status: string }) {
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
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        color: "white",
        background: color,
        fontSize: 12,
      }}
    >
      {status.replace("_", " ")}
    </span>
  );
}

const th: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 8,
  background: "#fafafa",
};
const td: React.CSSProperties = { border: "1px solid #ddd", padding: 8 };
