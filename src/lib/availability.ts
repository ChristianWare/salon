import { db } from "@/lib/db";
import { addMinutes, isBefore } from "date-fns";

/** returns array of ISO strings (“2025-08-07T14:30:00Z”) */
export async function getAvailableSlots({
  serviceId,
  groomerId,
  date, // “2025-08-07”
}: {
  serviceId: string;
  groomerId: string;
  date: string;
}) {
  const service = await db.service.findUnique({ where: { id: serviceId } });
  if (!service) return [];

  // get groomer workingHours JSON for the weekday
  const groomer = await db.groomer.findUnique({ where: { id: groomerId } });
  if (!groomer) return [];

  const weekday = new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
  }); // “Mon”
  const workingHours = (groomer.workingHours ?? {}) as Record<string, [string, string][]>;
  const ranges: [string, string][] = workingHours[weekday] ?? []; // [["09:00","17:00"]]

  // fetch existing bookings for that groomer on that day
  const bookings = await db.booking.findMany({
    where: {
      groomerId,
      start: {
        gte: new Date(date + "T00:00:00Z"),
        lt: new Date(date + "T23:59:59Z"),
      },
      status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
    },
    select: { start: true, end: true },
  });

  const slots: string[] = [];
  ranges.forEach(([from, to]) => {
    let cursor = new Date(`${date}T${from}:00`);
    const endRange = new Date(`${date}T${to}:00`);
    while (addMinutes(cursor, service.durationMin) <= endRange) {
      const overlap = bookings.some(
        (b) =>
          !(
            isBefore(b.end, cursor) ||
            isBefore(addMinutes(cursor, service.durationMin), b.start)
          )
      );
      if (!overlap && isBefore(new Date(), cursor))
        slots.push(cursor.toISOString());
      cursor = addMinutes(cursor, 15); // 15-min granularity
    }
  });
  return slots;
}
