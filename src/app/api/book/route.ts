/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/book/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { db } from "@/lib/db";
import { isGroomerAvailable } from "@/lib/availability";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { serviceId, groomerId, start } = await req.json();
  const service = await db.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.active)
    return NextResponse.json({ error: "bad service" }, { status: 400 });

  const startDate = new Date(start);
  const endDate = new Date(
    startDate.getTime() + service.durationMin * 60 * 1000
  );

  const userId = (session.user as any).id || session.user.userId; // you store userId on session
  if (!userId)
    return NextResponse.json({ error: "User ID missing" }, { status: 400 });

  // ✅ Final recheck
  const available = await isGroomerAvailable(groomerId, startDate, endDate);
  if (!available) {
    return NextResponse.json(
      { error: "Selected time is no longer available" },
      { status: 409 }
    );
  }

  // Create booking instantly as CONFIRMED (your “no pending” flow)
  const booking = await db.booking.create({
    data: {
      userId,
      serviceId,
      groomerId,
      start: startDate,
      end: endDate,
      depositCents: 0,
      tipCents: 0,
      status: "CONFIRMED",
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, bookingId: booking.id });
}
