
import styles from "./GroomerLayout.module.css";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireGroomer } from "@/lib/rbac";
// import ProfileEditor from "@/components/groomerPage/ProfileEditor/ProfileEditor";
// import BlockedDatesEditor from "@/components/groomerPage/BlockedDatesEditor/BlockedDatesEditor";
import GroomerPageIntro from "@/components/groomerPage/GroomerPageIntro/GroomerPageIntro";
import Button from "@/components/shared/Button/Button";
import { startOfDay, endOfDay, addDays, startOfMonth } from "date-fns";
import AdminKpiCard from "@/components/admin/AdminKpiCard/AdminKpiCard";
import Link from "next/link";



/*─────────────────────────────────────────────────
  1️⃣ Server Action: Update Profile
──────────────────────────────────────────────────*/
export async function updateProfile(formData: FormData) {
  "use server";
  const user = await requireGroomer();

  const bio = (formData.get("bio") as string).trim();
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

  if (!user.id) throw new Error("Missing groomer ID");
  await db.break.create({
    data: {
      groomerId: user.id!,
      date,
    },
  });
}

/*─────────────────────────────────────────────────
  3️⃣ Server Action: Remove Break Date
──────────────────────────────────────────────────*/
export async function removeBreak(formData: FormData) {
  "use server";
  await requireGroomer();

  const id = formData.get("id") as string;
  await db.break.delete({ where: { id } });
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

  // const blockedDates = groomer.breaks.map((b) => ({
  //   id: b.id,
  //   date: b.date.toISOString(),
  // }));

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

    // next 5 upcoming bookings
    db.booking.findMany({
      where: {
        groomerId: user.id,
        start: { gte: new Date() },
      },
      include: {
        service: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { start: "asc" },
      take: 5,
    }),
  ]);

  // convert cents → dollars
  const fmt = (agg: { _sum: { depositCents?: number | null; tipCents?: number | null } }) =>
    ((agg._sum.depositCents ?? 0) + (agg._sum.tipCents ?? 0)) / 100;

  const earningsToday = fmt(earningsTodayAgg);
  const earningsMTD = fmt(earningsMTDAgg);

  return (
    <section style={{ padding: "2rem" }}>
      <div className={styles.top}>
        <GroomerPageIntro />
      </div>

      <div className={styles.bottom}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <AdminKpiCard
            label='Today’s Appointments'
            value={appointmentsToday}
          />
          <AdminKpiCard label='Next 7 Days' value={appointmentsWeek} />
          <AdminKpiCard
            label='Earnings Today'
            value={`$${earningsToday.toFixed(2)}`}
          />
          <AdminKpiCard
            label='Earnings This Month'
            value={`$${earningsMTD.toFixed(2)}`}
          />
        </div>

        {/* ── New Requests Alert ───────────────────────── */}
        {pendingCount > 0 && (
          <p style={{ marginTop: "1rem", color: "#b33636" }}>
            You have{" "}
            <Link
              href='/groomer/bookings?filter=pending'
              style={{ textDecoration: "underline" }}
            >
              {pendingCount} new booking request
              {pendingCount > 1 ? "s" : ""}
            </Link>
          </p>
        )}

        {/* ── Upcoming Appointments ────────────────────── */}
        <section style={{ marginTop: "2rem" }}>
          <h2>Next Appointments</h2>
          {nextBookings.length === 0 ? (
            <p>You have no upcoming appointments.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {nextBookings.map((b) => {
                const start = new Date(b.start);
                const dateStr = start.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const timeStr = start.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <li
                    key={b.id}
                    style={{
                      padding: "0.5rem 0",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <strong>
                      {dateStr} at {timeStr}
                    </strong>
                    {" — "}
                    {b.service.name} with {b.user.name}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Quick Actions ────────────────────────────── */}
        <section style={{ marginTop: "2rem" }}>
          <h2>Quick Actions</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            <Button
              href='/groomer/availability'
              btnType='blueOutline'
              text='Manage Availability'
            />
            <Button
              href='/groomer/profile'
              btnType='blueOutline'
              text='Edit Profile'
            />
            <Button
              href='/groomer/bookings'
              btnType='blueOutline'
              text='View All Bookings'
            />
            <Button
              href='/groomer/earnings'
              btnType='blueOutline'
              text='View Earnings'
            />
          </div>
        </section>
      </div>

      {/* <ProfileEditor
        initialBio={groomer.bio || ""}
        initialSpecs={groomer.specialties}
        initialWorking={groomer.workingHours as any}
        onSave={updateProfile} // pass the server action down
      />

      <BlockedDatesEditor
        initialDates={blockedDates}
        onAddBreak={addBreak}
        onRemoveBreak={removeBreak}
      /> */}
    </section>
  );
}
