/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/book/prepare/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/stripeCustomer";
import { isGroomerAvailable } from "@/lib/availability";

const ANY_ID = "ANY";
const HOLD_MINUTES = 12;
const DEFAULT_DEPOSIT_PCT = 0.2; // used if service.depositPct is null
const DEFAULT_TAX_RATE = 0.0; // used if service.taxRate is null

type Body = {
  serviceId: string;
  groomerId: string; // may be "ANY"
  startIso: string; // exact start time ISO (from chosen slot)
  details?: {
    phone?: string;
    notes?: string;
    pet?: any; // arbitrary JSON
  };
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const userId = (session.user as any).id || (session.user as any).userId;
  if (!userId)
    return NextResponse.json({ error: "user missing" }, { status: 400 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const { serviceId, groomerId: incomingGroomerId, startIso, details } = body;
  if (!serviceId || !incomingGroomerId || !startIso) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const start = new Date(startIso);
  if (Number.isNaN(start.valueOf())) {
    return NextResponse.json({ error: "bad start" }, { status: 400 });
  }

  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      active: true,
      durationMin: true,
      priceCents: true,
      depositPct: true, // optional; fallback below if not in schema
      taxRate: true, // optional; fallback below if not in schema
    } as any,
  });
  if (!service || !service.active) {
    return NextResponse.json({ error: "bad service" }, { status: 400 });
  }

  const durationMin = typeof service.durationMin === "number" ? service.durationMin : 0;
  const end = new Date(start.getTime() + durationMin * 60 * 1000);

  // Pick/validate groomer
  let groomerId = incomingGroomerId;
  if (!groomerId || groomerId === ANY_ID) {
    // auto-assign first available groomer
    const candidates = await db.groomer.findMany({
      where: { active: true },
      select: { id: true },
    });
    let chosen: string | null = null;
    for (const g of candidates) {
      if (await isGroomerAvailable(g.id, start, end)) {
        chosen = g.id;
        break;
      }
    }
    if (!chosen) {
      return NextResponse.json(
        { error: "time not available" },
        { status: 409 }
      );
    }
    groomerId = chosen;
  } else {
    const g = await db.groomer.findUnique({
      where: { id: groomerId },
      select: { id: true, active: true },
    });
    if (!g || !g.active)
      return NextResponse.json({ error: "bad groomer" }, { status: 400 });
  }

  // Recheck availability for that specific groomer/time
  const free = await isGroomerAvailable(groomerId, start, end);
  if (!free) {
    return NextResponse.json({ error: "time not available" }, { status: 409 });
  }

  // Totals (server authority)
  const depositPct =
    typeof service.depositPct === "number"
      ? service.depositPct
      : DEFAULT_DEPOSIT_PCT;
  const taxRate =
    typeof service.taxRate === "number" ? service.taxRate : DEFAULT_TAX_RATE;

  const round = (n: number) => Math.round(n);
  const depositCents = round(Number(service.priceCents) * depositPct);
  const taxCents = round(depositCents * taxRate);
  const amountDueCents = depositCents + taxCents;

  // Stripe customer
  const customerId = await getOrCreateStripeCustomer(userId);

  // Create/hold booking (PENDING_PAYMENT) with expiry
  const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);
  const booking = await db.booking.create({
    data: {
      userId,
      serviceId,
      groomerId,
      start,
      end,
      status: "PENDING_PAYMENT",
      depositCents,
      taxCents,
      amountDueCents,
      expiresAt,
      notes: details?.notes || null,
      petJson: details?.pet ?? null,
    },
    select: { id: true },
  });

  // Create PaymentIntent
  const intent = await stripe.paymentIntents.create(
    {
      amount: amountDueCents,
      currency: "usd",
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      setup_future_usage: "off_session",
      metadata: {
        bookingId: booking.id,
        userId,
        serviceId,
        groomerId,
        startIso,
      },
    },
    {
      // Optional: idempotency for retries from client
      idempotencyKey: `prepare:${booking.id}`,
    }
  );

  await db.booking.update({
    where: { id: booking.id },
    data: { paymentIntentId: intent.id },
  });

  return NextResponse.json({
    bookingId: booking.id,
    clientSecret: intent.client_secret,
    totals: {
      depositCents,
      taxCents,
      amountDueCents,
    },
    hold: { expiresAt: expiresAt.toISOString(), minutes: HOLD_MINUTES },
  });
}
