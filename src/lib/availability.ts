/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/availability.ts
import { db } from "@/lib/db";
import { addMinutes, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";

/** Quick overlap check for a groomer between [start, end) */
export async function isGroomerAvailable(
  groomerId: string,
  start: Date,
  end: Date
) {
  // block if a "break" date matches
  const dayStart = startOfDay(start);
  const dayEnd = endOfDay(start);
  const blocked = await db.break.findFirst({
    where: { groomerId, date: { gte: dayStart, lte: dayEnd } },
  });
  if (blocked) return false;

  // any overlapping bookings (confirmed or pending)
  const overlap = await db.booking.findFirst({
    where: {
      groomerId,
      status: { in: ["CONFIRMED", "PENDING"] },
      // overlap if: start < existing.end && end > existing.start
      start: { lt: end },
      end: { gt: start },
    },
    select: { id: true },
  });

  return !overlap;
}

/** Create HH:mm string (24h) */
function hm(d: Date) {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Generate bookable slots for a given date in the groomer's local "workingHours" (stored as HH:mm ranges by weekday) */
export async function getAvailableSlotsForDate(params: {
  groomerId: string;
  serviceDurationMin: number;
  date: Date; // local date the user picked; treat as that day
  slotIntervalMin?: number; // default 15
  bufferMin?: number; // optional prep/cleanup buffer
  minLeadMinutes?: number; // disallow near‑term bookings (e.g., 120)
}) {
  const {
    groomerId,
    serviceDurationMin,
    date,
    slotIntervalMin = 15,
    bufferMin = 0,
    minLeadMinutes = 0,
  } = params;

  const groomer = await db.groomer.findUnique({
    where: { id: groomerId },
    select: { workingHours: true, active: true },
  });
  if (!groomer?.active) return [];

  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    date.getDay()
  ];
  const wh = (groomer.workingHours as any) || {};
  const intervals: [string, string][] = wh[weekday] || []; // e.g., [["09:00","17:00"]]

  // breaks that day
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const isBlocked = await db.break.findFirst({
    where: { groomerId, date: { gte: dayStart, lte: dayEnd } },
    select: { id: true },
  });
  if (isBlocked) return [];

  // existing bookings that day (to exclude overlaps quickly)
  const existing = await db.booking.findMany({
    where: {
      groomerId,
      status: { in: ["CONFIRMED", "PENDING"] },
      start: { lt: dayEnd },
      end: { gt: dayStart },
    },
    select: { start: true, end: true },
    orderBy: { start: "asc" },
  });

  const now = new Date();
  const minStart = addMinutes(now, minLeadMinutes);

  const slots: Date[] = [];

  // for each working interval, step by slotIntervalMin and test duration
  for (const [startHm, endHm] of intervals) {
    const [sh, sm] = startHm.split(":").map(Number);
    const [eh, em] = endHm.split(":").map(Number);

    const intervalStart = new Date(date);
    intervalStart.setHours(sh, sm, 0, 0);

    const intervalEnd = new Date(date);
    intervalEnd.setHours(eh, em, 0, 0);

    // walk the interval
    for (
      let cursor = new Date(intervalStart);
      isBefore(
        addMinutes(cursor, serviceDurationMin + bufferMin),
        addMinutes(intervalEnd, 1)
      ); // allow exact fit
      cursor = addMinutes(cursor, slotIntervalMin)
    ) {
      const slotStart = cursor;
      const slotEnd = addMinutes(slotStart, serviceDurationMin + bufferMin);

      // lead time guard
      if (isBefore(slotStart, minStart)) continue;

      // exclude if overlap with any existing range (fast in‑memory check)
      const overlapping = existing.some(
        (b) => slotStart < b.end && slotEnd > b.start
      );
      if (overlapping) continue;

      slots.push(new Date(slotStart));
    }
  }

  return slots;
}

/** Format a Date as a human label like "Aug 8, 10:30 AM" */
export function formatHuman(dt: Date) {
  const d = dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const t = dt.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${d} ${t}`;
}

/** Return a plain object suited for JSON response */
export function serializeSlots(slots: Date[]) {
  return slots.map((d) => ({
    iso: d.toISOString(),
    label: formatHuman(d),
    time24: hm(d),
  }));
}
