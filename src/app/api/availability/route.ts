/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/availability/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAvailableSlotsForDate, serializeSlots } from "@/lib/availability";

const ANY_ID = "ANY";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const groomerId = searchParams.get("groomerId") || "";
  const serviceId = searchParams.get("serviceId") || "";
  const dateStr = searchParams.get("date"); // YYYY-MM-DD

  if (!groomerId || !serviceId || !dateStr) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { durationMin: true, active: true },
  });
  if (!service?.active) {
    return NextResponse.json({ error: "bad service" }, { status: 400 });
  }

  const date = new Date(dateStr + "T00:00:00");

  // SPECIFIC GROOMER — keep your original behavior & serializer
  if (groomerId !== ANY_ID) {
    const slots = await getAvailableSlotsForDate({
      groomerId,
      serviceDurationMin: service.durationMin,
      date,
      slotIntervalMin: 15,
      bufferMin: 0,
      minLeadMinutes: 60,
    });

    // Ensure shape: [{ iso, time24, label }]
    return NextResponse.json(serializeSlots(slots), { status: 200 });
  }

  // ANY GROOMER — compute for all eligible, serialize, then tag
  const eligibleGroomers = await db.groomer.findMany({
    where: {
      active: true,
      // If you track service capability per groomer, add:
      // services: { some: { id: serviceId } },
    },
    select: {
      id: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (eligibleGroomers.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  const perGroomerSerialized = await Promise.all(
    eligibleGroomers.map(async (g) => {
      const slots = await getAvailableSlotsForDate({
        groomerId: g.id,
        serviceDurationMin: service.durationMin,
        date,
        slotIntervalMin: 15,
        bufferMin: 0,
        minLeadMinutes: 60,
      });

      const serialized = serializeSlots(slots); // [{ iso, time24, label }]
      const groomerName = g.user?.name || g.user?.email || "Staff";

      return serialized.map((s: any) => ({
        ...s, // keeps iso, time24, label
        groomerId: g.id,
        groomerName,
      }));
    })
  );

  const merged = perGroomerSerialized
    .flat()
    .sort((a, b) => (a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0));

  return NextResponse.json(merged, { status: 200 });
}
