import Link from "next/link";
import { db } from "@/lib/db";
import BookingWizard from "@/components/bookingPage/BookingWizard/BookingWizard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BookingPage() {
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

  const groomerRows = await db.groomer.findMany({
    where: { active: true },
    orderBy: { user: { name: "asc" } },
    include: { user: { select: { name: true } } },
  });

  const groomers = groomerRows.map((g) => ({
    id: g.id,
    name: g.user?.name ?? "—",
  }));

  return (
    <section style={{ padding: "2rem" }}>
      {/* Header */}
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
          Book an Appointment
        </h1>
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

      {/* Wizard card */}
      <section style={card}>
        <BookingWizard services={services} groomers={groomers} />
      </section>
    </section>
  );
}

/* inline tokens to match your app */
const card: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 8,
  padding: 12,
  background: "white",
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
