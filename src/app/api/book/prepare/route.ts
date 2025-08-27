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
// Default to FULL payment when nothing else is configured:
const DEFAULT_DEPOSIT_RATE = 1.0; // 100%
const DEFAULT_TAX_RATE = 0.0; // 0%

type Body = {
  serviceId?: string;
  groomerId?: string; // may be "ANY"
  startIso?: string; // exact start time ISO
  slotIso?: string; // alias accepted for compatibility
  details?: {
    phone?: string;
    notes?: string;
    pet?: any; // arbitrary JSON
  };
};

function normalizeRate(input: unknown, fallback: number): number {
  // Accepts "20", 20 => 0.2 ; "0.2", 0.2 => 0.2 ; clamps to [0,1]
  const n = typeof input === "number" ? input : parseFloat(String(input ?? ""));
  if (!Number.isFinite(n)) return fallback;
  const v = n > 1 ? n / 100 : n;
  return Math.max(0, Math.min(1, v));
}

export async function POST(req: Request) {
  // 1) Auth
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const userId = (session.user as any).id || (session.user as any).userId;
  if (!userId)
    return NextResponse.json({ error: "user missing" }, { status: 400 });

  // 2) Parse body
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const serviceId = body.serviceId;
  const incomingGroomerId = body.groomerId;
  const startIso = body.startIso || body.slotIso;
  const details = body.details;

  if (!serviceId || !incomingGroomerId || !startIso) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const start = new Date(startIso);
  if (Number.isNaN(start.valueOf())) {
    return NextResponse.json({ error: "bad start" }, { status: 400 });
  }

  // 3) Load service and global config
  const [service, depositCfg, taxCfg] = await Promise.all([
    db.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        active: true,
        durationMin: true,
        priceCents: true,
        depositPct: true, // service-level override (0..1)
        taxRate: true, // service-level override (0..1)
      },
    }),
    db.config.findUnique({ where: { key: "depositPct" } }), // stored as percentage text, e.g. "20" or "100"
    db.config.findUnique({ where: { key: "taxRate" } }), // stored as percentage text, e.g. "8.6"
  ]);

  if (!service || !service.active) {
    return NextResponse.json({ error: "bad service" }, { status: 400 });
  }

  const durationMin =
    typeof service.durationMin === "number" ? service.durationMin : 0;
  const end = new Date(start.getTime() + durationMin * 60 * 1000);

  // 4) Choose/validate groomer
  let groomerId = incomingGroomerId;
  if (!groomerId || groomerId === ANY_ID) {
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

  // 5) Compute amount due (service overrides -> global config -> defaults)
  const baseCents = Number(service.priceCents) || 0;

  const globalDepositRate = normalizeRate(
    depositCfg?.value,
    DEFAULT_DEPOSIT_RATE
  );
  const globalTaxRate = normalizeRate(taxCfg?.value, DEFAULT_TAX_RATE);

  const depositRate =
    typeof service.depositPct === "number"
      ? normalizeRate(service.depositPct, globalDepositRate)
      : globalDepositRate;

  const taxRate =
    typeof service.taxRate === "number"
      ? normalizeRate(service.taxRate, globalTaxRate)
      : globalTaxRate;

  const round = (n: number) => Math.round(n);
  const depositCents = round(baseCents * depositRate);
  const taxCents = round(depositCents * taxRate);
  const amountDueCents = depositCents + taxCents;

  // 6) Stripe customer
  const customerId = await getOrCreateStripeCustomer(userId);

  // 7) Create booking hold (PENDING_PAYMENT) with expiry
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
      taxCents: taxCents || null,
      amountDueCents,
      expiresAt,
      notes: details?.notes || null,
      petJson: details?.pet ?? null,
    },
    select: { id: true },
  });

  // 8) Create PaymentIntent for amountDueCents
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
        startIso: start.toISOString(),
      },
    },
    {
      idempotencyKey: `prepare:${booking.id}`,
    }
  );

  // 9) Save PI id on booking
  await db.booking.update({
    where: { id: booking.id },
    data: { paymentIntentId: intent.id },
  });

  // 10) Response expected by your CheckoutStep / wizard
  return NextResponse.json({
    bookingId: booking.id,
    clientSecret: intent.client_secret,
    amountDueCents,
    slotIso: start.toISOString(),
    // Optional extras:
    totals: { depositCents, taxCents, amountDueCents },
    hold: { expiresAt: expiresAt.toISOString(), minutes: HOLD_MINUTES },
  });
}
