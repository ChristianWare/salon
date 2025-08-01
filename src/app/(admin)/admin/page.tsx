import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import AdminPageIntro from "@/components/admin/AdminPageIntro/AdminPageIntro";
import { db } from "@/lib/db";
import AdminKpiCard from "@/components/admin/AdminKpiCard/AdminKpiCard";
import Link from "next/link";
import { startOfDay, startOfMonth } from "date-fns";

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
    <div>
      <AdminPageIntro />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <AdminKpiCard label='Bookings Today' value={bookingsToday} />
        <AdminKpiCard
          label='Revenue This Month'
          value={`$${revenueThisMonth.toFixed(2)}`}
        />
        <AdminKpiCard label='Total Bookings' value={totalBookings} />
        <AdminKpiCard label='Registered Users' value={totalUsers} />
      </div>
      {/* Quick Links */}
      <nav>
        <ul style={{ display: "flex", gap: "1rem" }}>
          <li>
            <Link href='/admin/groomers'>Add Groomer</Link>
          </li>
          <li>
            <Link href='/admin/services'>Add Service</Link>
          </li>
          <li>
            <Link href='/admin/bookings'>View Bookings</Link>
          </li>
          <li>
            <Link href='/admin/customers'>View Customers</Link>
          </li>
        </ul>
      </nav>{" "}
    </div>
  );
}
