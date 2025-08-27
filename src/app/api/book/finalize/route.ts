// src/app/api/book/finalize/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
  typescript: true,
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }

  const { bookingId } = await req.json();
  if (!bookingId) {
    return NextResponse.json({ error: "missing bookingId" }, { status: 400 });
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      groomer: { select: { autoConfirm: true } },
      service: { select: { priceCents: true } },
    },
  });
  if (!booking) {
    return NextResponse.json({ error: "booking not found" }, { status: 404 });
  }
  if (booking.userId !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!booking.paymentIntentId) {
    return NextResponse.json(
      { error: "no payment intent on booking" },
      { status: 400 }
    );
  }

  // Retrieve PI from Stripe and verify status/amount
  const pi = await stripe.paymentIntents.retrieve(booking.paymentIntentId);

  // Optional: double-check metadata bookingId matches
  if ((pi.metadata?.bookingId ?? "") !== bookingId) {
    // not fatal, but good to enforce if you set metadata in prepare
    // return NextResponse.json({ error: "payment mismatch" }, { status: 400 });
  }

  // Accept either succeeded or processing (depends on your risk appetite)
  const ok =
    pi.status === "succeeded" ||
    (pi.status === "processing" && (pi.amount_received ?? 0) > 0);

  if (!ok) {
    return NextResponse.json(
      { error: `payment not completed (status=${pi.status})` },
      { status: 409 }
    );
  }

  // Try to get a receipt URL
  let receiptUrl: string | null = null;
  if (pi.latest_charge) {
    const chargeId =
      typeof pi.latest_charge === "string"
        ? pi.latest_charge
        : pi.latest_charge.id;
    const ch = await stripe.charges.retrieve(chargeId);
    receiptUrl = ch.receipt_url ?? null;
  }

  const nextStatus = booking.groomer?.autoConfirm ? "CONFIRMED" : "PENDING";

  await db.booking.update({
    where: { id: booking.id },
    data: {
      status: nextStatus,
      depositCents: Number.isFinite(pi.amount_received)
        ? pi.amount_received
        : booking.depositCents,
      receiptUrl: receiptUrl ?? booking.receiptUrl,
    },
  });

  return NextResponse.json({ ok: true, status: nextStatus });
}
