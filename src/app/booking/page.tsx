// import Link from "next/link";
import { db } from "@/lib/db";
import BookingWizard from "@/components/bookingPage/BookingWizard/BookingWizard";
import BookingPageIntro from "@/components/bookingPage/BookingPageIntro/BookingPageIntro";
// import LayoutWrapper from "@/components/shared/LayoutWrapper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

const dayToIdx: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export default async function BookingPage() {
  // Services
  const services = await db.service.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      durationMin: true,
      priceCents: true,
      active: true,
    },
  });

  // Groomers (with name, workingHours JSON, and blackout dates)
  const groomerRows = await db.groomer.findMany({
    where: { active: true },
    orderBy: { user: { name: "asc" } },
    select: {
      id: true,
      workingHours: true, // JSON like { Mon: [[start,end]], ... }
      user: { select: { name: true } },
      breaks: { select: { date: true } }, // blackout dates
    },
  });

  // Wizard dropdown list
  const groomers = groomerRows.map((g) => ({
    id: g.id,
    name: g.user?.name ?? "—",
  }));

  // Build calendars map: { [groomerId]: { workDays: number[], blackoutISO: string[] } }
  const calendars = Object.fromEntries(
    groomerRows.map((g) => {
      const wh = (g.workingHours || {}) as Record<string, [string, string][]>;
      const workDays = Object.entries(wh)
        .filter(([, slots]) => Array.isArray(slots) && slots.length > 0)
        .map(([day]) => dayToIdx[day]!)
        .filter((n) => Number.isInteger(n))
        .sort((a, b) => a - b);

      const blackoutISO = (g.breaks || []).map((b) => ymd(b.date));

      return [g.id, { workDays, blackoutISO }];
    })
  );

  return (
    <main>
      {/* Header */}
      <BookingPageIntro />
      {/* <LayoutWrapper>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
            Book an Appointment
          </h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href='/dashboard/my-bookings' style={outlineBtn}>
              My Bookings
            </Link>
          </div>
        </div>

        <p style={{ color: "#555", marginTop: 0, marginBottom: 12 }}>
          Choose a service, pick a groomer and date, then select an available
          time.
        </p>
      </LayoutWrapper> */}

      <section style={card}>
        <BookingWizard
          services={services}
          groomers={groomers}
          calendars={calendars}
        />
      </section>
    </main>
  );
}

/* inline tokens to match your app */
const card: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 8,
  padding: 12,
  background: "white",
};
// const outlineBtn: React.CSSProperties = {
//   padding: "8px 14px",
//   borderRadius: 6,
//   background: "white",
//   color: "#333",
//   border: "1px solid #ddd",
//   cursor: "pointer",
//   textDecoration: "none",
// };
