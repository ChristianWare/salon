// src/app/(admin)/page.tsx
import styles from "./AdminPage.module.css";
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { db } from "@/lib/db";
import AdminPageIntro from "@/components/admin/AdminPageIntro/AdminPageIntro";
import AdminKpiCard from "@/components/admin/AdminKpiCard/AdminKpiCard";
import Button from "@/components/shared/Button/Button";
import { startOfDay, endOfDay, startOfMonth, addDays } from "date-fns";
import AdminMonthlyCalendar from "@/components/admin/AdminMonthlyCalendar/AdminMonthlyCalendar";

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const upcomingEnd = addDays(now, 14);

  const [
    bookingsToday,
    revenueAgg,
    totalBookings,
    totalUsers,
    pendingBookings,
    activeGroomers,
    activeServices,
  ] = await db.$transaction([
    db.booking.count({ where: { start: { gte: todayStart, lte: todayEnd } } }),
    db.booking.aggregate({
      _sum: { depositCents: true, tipCents: true },
      where: { start: { gte: monthStart } },
    }),
    db.booking.count(),
    db.user.count({ where: { role: "USER" } }),
    db.booking.count({ where: { status: "PENDING", start: { gte: now } } }),
    db.groomer.count({ where: { active: true } }),
    db.service.count({ where: { active: true } }),
  ]);

  const revenueThisMonth =
    ((revenueAgg._sum.depositCents ?? 0) + (revenueAgg._sum.tipCents ?? 0)) /
    100;

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

  const newBookings = await db.booking.findMany({
    where: { createdAt: { gte: todayStart, lte: todayEnd } },
    include: {
      service: { select: { name: true, durationMin: true, priceCents: true } },
      user: { select: { name: true, email: true } },
      groomer: { select: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const upcomingBookings = await db.booking.findMany({
    where: {
      start: { gt: todayEnd, lte: upcomingEnd },
      status: { in: ["CONFIRMED", "PENDING"] },
    },
    include: {
      service: { select: { name: true, durationMin: true } },
      user: { select: { name: true, email: true } },
      groomer: { select: { user: { select: { name: true } } } },
    },
    orderBy: { start: "asc" },
    take: 10,
  });

  const activeHolds = await db.booking.findMany({
    where: { status: "PENDING_PAYMENT", expiresAt: { gt: now } },
    include: {
      service: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { expiresAt: "asc" },
    take: 10,
  });

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

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <AdminPageIntro />
      </div>

      <div className={styles.bottom}>
        <h2 className={styles.heading}>Analytics</h2>

        <div className={styles.kpiCards}>
          <AdminKpiCard label='Bookings Today' value={bookingsToday} />
          <AdminKpiCard
            label='Revenue This Month'
            value={`$${revenueThisMonth.toFixed(2)}`}
          />
          <AdminKpiCard label='Total Bookings' value={totalBookings} />
          <AdminKpiCard label='Registered Users' value={totalUsers} />
          <AdminKpiCard label='Pending Bookings' value={pendingBookings} />
          <AdminKpiCard label='Active Groomers' value={activeGroomers} />
          <AdminKpiCard label='Active Services' value={activeServices} />
        </div>

        {/* <div className={`${styles.kpiCards} ${styles.mt12}`}>
        </div> */}

        <h2 className={styles.heading}>New Bookings (Created Today)</h2>
        <div className={styles.tableScroll}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead className={styles.tablethead}>
                <tr>
                  <TH>Booked At</TH>
                  <TH>Start</TH>
                  <TH>Service</TH>
                  <TH>Customer</TH>
                  <TH>Groomer</TH>
                  <TH>Status</TH>
                  <TH>Actions</TH>
                </tr>
              </thead>
              <tbody>
                {newBookings.length === 0 ? (
                  <tr>
                    <TD colSpan={7} className={styles.center}>
                      No new bookings today.
                    </TD>
                  </tr>
                ) : (
                  newBookings.map((b) => {
                    const createdStr = new Date(b.createdAt).toLocaleString(
                      [],
                      {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    );
                    const startStr = new Date(b.start).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <tr key={b.id}>
                        <TD label='Booked At'>{createdStr}</TD>
                        <TD label='Start'>{startStr}</TD>
                        <TD label='Service'>
                          {b.service.name}{" "}
                          <small>({b.service.durationMin}m)</small>
                        </TD>
                        <TD label='Customer'>
                          {b.user.name ?? "—"}
                          <br />
                          <small>{b.user.email}</small>
                        </TD>
                        <TD label='Groomer'>{b.groomer.user?.name ?? "—"}</TD>
                        <TD label='Status'>
                          <StatusBadge status={b.status} />
                        </TD>
                        <TD label='Actions'>
                          <div className={styles.btnContainer}>
                            <Button
                              href={`/admin/bookings/${b.id}`}
                              btnType='blueOutline'
                              text='View'
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
        </div>

        <h2 className={styles.heading}>Today’s Schedule</h2>
        <div className={styles.tableScroll}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <TH>Time</TH>
                  <TH>Service</TH>
                  <TH>Customer</TH>
                  <TH>Groomer</TH>
                  <TH>Status</TH>
                  <TH>Actions</TH>
                </tr>
              </thead>
              <tbody>
                {todaysBookings.length === 0 ? (
                  <tr>
                    <TD colSpan={6} className={styles.center}>
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
                        <TD label='Time'>{timeStr}</TD>
                        <TD label='Service'>
                          {b.service.name}{" "}
                          <small>({b.service.durationMin}m)</small>
                        </TD>
                        <TD label='Customer'>
                          {b.user.name ?? "—"}
                          <br />
                          <small>{b.user.email}</small>
                        </TD>
                        <TD label='Groomer'>{b.groomer.user?.name ?? "—"}</TD>
                        <TD label='Status'>
                          <StatusBadge status={b.status} />
                        </TD>
                        <TD label='Actions'>
                          <Button
                            href={`/admin/bookings/${b.id}`}
                            btnType='blueOutline'
                            text='View'
                          />
                        </TD>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <h2 className={styles.heading}>Upcoming Bookings (Next 2 Weeks)</h2>
        <div className={styles.tableScroll}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <TH>Date</TH>
                  <TH>Time</TH>
                  <TH>Service</TH>
                  <TH>Customer</TH>
                  <TH>Groomer</TH>
                  <TH>Status</TH>
                  <TH>Actions</TH>
                </tr>
              </thead>
              <tbody>
                {upcomingBookings.length === 0 ? (
                  <tr>
                    <TD colSpan={7} className={styles.center}>
                      No upcoming bookings in the next two weeks.
                    </TD>
                  </tr>
                ) : (
                  upcomingBookings.map((b) => {
                    const d = new Date(b.start);
                    const dateStr = d.toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const timeStr = d.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <tr key={b.id}>
                        <TD label='Date'>{dateStr}</TD>
                        <TD label='Time'>{timeStr}</TD>
                        <TD label='Service'>
                          {b.service.name}{" "}
                          <small>({b.service.durationMin}m)</small>
                        </TD>
                        <TD label='Customer'>
                          {b.user.name ?? "—"}
                          <br />
                          <small>{b.user.email}</small>
                        </TD>
                        <TD label='Groomer'>{b.groomer.user?.name ?? "—"}</TD>
                        <TD label='Status'>
                          <StatusBadge status={b.status} />
                        </TD>
                        <TD label='Actions'>
                          <Button
                            href={`/admin/bookings/${b.id}`}
                            btnType='blueOutline'
                            text='View'
                          />
                        </TD>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {pendingBookings > 0 && (
          <>
            <h2 className={styles.heading}>Pending Approvals</h2>
            <div className={styles.tableScroll}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <TH>Date</TH>
                      <TH>Time</TH>
                      <TH>Service</TH>
                      <TH>Customer</TH>
                      <TH>Groomer</TH>
                      <TH>Actions</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingList.length === 0 ? (
                      <tr>
                        <TD colSpan={6} className={styles.center}>
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
                            <TD label='Date'>{dateStr}</TD>
                            <TD label='Time'>{timeStr}</TD>
                            <TD label='Service'>{b.service.name}</TD>
                            <TD label='Customer'>
                              {b.user.name ?? "—"}
                              <br />
                              <small>{b.user.email}</small>
                            </TD>
                            <TD label='Groomer'>
                              {b.groomer.user?.name ?? "—"}
                            </TD>
                            <TD label='Actions'>
                              <Button
                                href={`/admin/bookings/${b.id}`}
                                btnType='blueOutline'
                                text='View'
                              />
                            </TD>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeHolds.length > 0 && (
          <>
            <h2 className={styles.heading}>Active Payment Holds</h2>
            <div className={styles.tableScroll}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <TH>Created</TH>
                      <TH>Expires</TH>
                      <TH>Customer</TH>
                      <TH>Service</TH>
                      <TH>Actions</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {activeHolds.map((b) => {
                      const created = new Date(b.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const expires = b.expiresAt
                        ? new Date(b.expiresAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—";
                      return (
                        <tr key={b.id}>
                          <TD label='Created'>{created}</TD>
                          <TD label='Expires'>{expires}</TD>
                          <TD label='Customer'>
                            {b.user?.name ?? "—"}
                            <br />
                            <small>{b.user?.email ?? "—"}</small>
                          </TD>
                          <TD label='Service'>{b.service?.name ?? "—"}</TD>
                          <TD label='Actions'>
                            <Button
                              href={`/admin/bookings/${b.id}`}
                              btnType='blueOutline'
                              text='View'
                            />
                          </TD>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <h2 className={styles.heading}>Calendar</h2>
        <div className={styles.mb24}>
          <AdminMonthlyCalendar />
        </div>

        {/* <h2 className={styles.heading}>Quick Links</h2>
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
        </div> */}
      </div>
    </div>
  );
}

/* helpers */
function TH({ children }: { children: React.ReactNode }) {
  return <th className={styles.th}>{children}</th>;
}
function TD({
  children,
  colSpan,
  className,
  label,
}: {
  children: React.ReactNode;
  colSpan?: number;
  className?: string;
  label?: string;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`${styles.td} ${className ? className : ""}`}
      data-label={label || ""}
    >
      {children}
    </td>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let extra = "";
  if (s === "confirmed") extra = styles.badge_confirmed;
  else if (s === "pending") extra = styles.badge_pending;
  else if (s === "completed") extra = styles.badge_completed;
  else if (s === "canceled") extra = styles.badge_canceled;
  else if (s === "no_show") extra = styles.badge_noshow;

  return (
    <span className={`${styles.badge} ${extra}`}>
      {status.replace("_", " ")}
    </span>
  );
}
