// src/app/api/availability/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAvailableSlotsForDate, serializeSlots } from "@/lib/availability";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const groomerId = searchParams.get("groomerId") || "";
  const serviceId = searchParams.get("serviceId") || "";
  const dateStr = searchParams.get("date"); // expect YYYY-MM-DD from client

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

  // parse local date (assume store local time zone on server)
  const date = new Date(dateStr + "T00:00:00");

  const slots = await getAvailableSlotsForDate({
    groomerId,
    serviceDurationMin: service.durationMin,
    date,
    slotIntervalMin: 15,
    bufferMin: 0,
    minLeadMinutes: 60, // example: 1 hour lead time
  });

  return NextResponse.json(serializeSlots(slots));
}
