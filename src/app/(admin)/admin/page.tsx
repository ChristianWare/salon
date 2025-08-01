import styles from "./AdminPage.module.css";
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import AdminPageIntro from "@/components/admin/AdminPageIntro/AdminPageIntro";
import { db } from "@/lib/db";
import AdminKpiCard from "@/components/admin/AdminKpiCard/AdminKpiCard";
import { startOfDay, startOfMonth } from "date-fns";
import Button from "@/components/shared/Button/Button";

export default async function AdminPage() {
  // 1. Enforce ADMIN only
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // 2. Compute date boundaries
  const todayStart = startOfDay(new Date());
  const monthStart = startOfMonth(new Date());

  // 3. Fetch KPIs in one transaction
  const [bookingsToday, revenueAgg, totalBookings, totalUsers] =
    await db.$transaction([
      // number of bookings starting today
      db.booking.count({ where: { start: { gte: todayStart } } }),
      // sum of deposits + tips month-to-date
      db.booking.aggregate({
        _sum: { depositCents: true, tipCents: true },
        where: { start: { gte: monthStart } },
      }),
      // all-time booking count
      db.booking.count(),
      // total registered users (role = USER)
      db.user.count({ where: { role: "USER" } }),
    ]);

  // 4. Convert cents to dollars
  const revenueThisMonth =
    ((revenueAgg._sum.depositCents ?? 0) + (revenueAgg._sum.tipCents ?? 0)) /
    100;

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
