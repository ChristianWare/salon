import { db } from "@/lib/db";
import BookingWizard from "@/components/bookingPage/BookingWizard/BookingWizard";

export default async function BookingPage() {
  const services = await db.service.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  const groomers = await db.groomer.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <section style={{ padding: "2rem" }}>
      <h1>Book an Appointment</h1>
      <BookingWizard services={services} groomers={groomers} />
    </section>
  );
}
