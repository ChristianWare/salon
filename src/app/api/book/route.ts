/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/book/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { db } from "@/lib/db";
import { isGroomerAvailable } from "@/lib/availability";

const ANY_ID = "ANY";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const body = await req.json();
  const serviceId: string | undefined = body.serviceId;
  let groomerId: string | undefined = body.groomerId;
  const start: string | undefined = body.start;

  if (!serviceId || !start) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { id: true, active: true, durationMin: true },
  });
  if (!service || !service.active) {
    return NextResponse.json({ error: "bad service" }, { status: 400 });
  }

  const startDate = new Date(start);
  if (Number.isNaN(startDate.valueOf())) {
    return NextResponse.json({ error: "bad start" }, { status: 400 });
  }
  const endDate = new Date(
    startDate.getTime() + service.durationMin * 60 * 1000
  );

  const userId = (session.user as any).id || (session.user as any).userId;
  if (!userId) {
    return NextResponse.json({ error: "User ID missing" }, { status: 400 });
  }

  // ─────────────────────────────────────────────────────
  // If groomerId is "ANY" or not set, auto-assign one.
  // Adjust the eligibility filter to your schema (e.g., services relation).
  // ─────────────────────────────────────────────────────
  if (!groomerId || groomerId === ANY_ID) {
    // 1) Find eligible groomers (active; optionally capable of this service)
    const eligible = await db.groomer.findMany({
      where: {
        active: true,
        // If you track service capability per groomer, uncomment and adapt:
        // services: { some: { id: serviceId } },
      },
      select: {
        id: true,
        user: { select: { name: true } },
      },
    });

    if (eligible.length === 0) {
      return NextResponse.json(
        { error: "No staff available for this service" },
        { status: 409 }
      );
    }

    // 2) Pick the first available groomer for that exact time window
    //    (you can replace this with round-robin or load-balancing later)
    let chosen: string | null = null;
    for (const g of eligible) {
      // Reuse your availability checker
      const ok = await isGroomerAvailable(g.id, startDate, endDate);
      if (ok) {
        chosen = g.id;
        break;
      }
    }

    if (!chosen) {
      return NextResponse.json(
        { error: "Selected time is no longer available" },
        { status: 409 }
      );
    }

    groomerId = chosen;
  } else {
    // Validate the specified groomer exists & (optionally) can perform the service
    const g = await db.groomer.findUnique({
      where: { id: groomerId },
      select: { id: true, active: true },
    });
    if (!g || !g.active) {
      return NextResponse.json({ error: "bad groomer" }, { status: 400 });
    }
    // If you track service capability:
    // const canDo = await db.groomer.findFirst({
    //   where: { id: groomerId, services: { some: { id: serviceId } } },
    //   select: { id: true },
    // });
    // if (!canDo) return NextResponse.json({ error: "groomer can't perform service" }, { status: 400 });
  }

  // Final recheck (race-proofing)
  const available = await isGroomerAvailable(groomerId!, startDate, endDate);
  if (!available) {
    return NextResponse.json(
      { error: "Selected time is no longer available" },
      { status: 409 }
    );
  }

  // Create booking instantly as CONFIRMED
  const booking = await db.booking.create({
    data: {
      userId,
      serviceId,
      groomerId: groomerId!, // now guaranteed real ID
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
