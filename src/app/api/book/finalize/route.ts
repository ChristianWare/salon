/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/book/finalize/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
  typescript: true,
});

export async function POST(req: Request) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        groomerId: true,
        start: true,
        amountDueCents: true,
        paymentIntentId: true,
      },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // If already promoted, return early
    if (booking.status === "CONFIRMED" || booking.status === "PENDING") {
      return NextResponse.json({ status: booking.status });
    }

    // Verify PI is actually paid
    const piId = booking.paymentIntentId;
    if (!piId) {
      return NextResponse.json(
        { error: "No PaymentIntent stored on booking" },
        { status: 400 }
      );
    }

    const pi = await stripe.paymentIntents.retrieve(piId);

    if (pi.status !== "succeeded") {
      // Not paid yet — keep it pending_payment
      return NextResponse.json(
        { error: `PaymentIntent not succeeded (${pi.status})` },
        { status: 400 }
      );
    }

    // (Optional) pull receipt URL from latest charge
    let receiptUrl: string | undefined;
    const charge =
      typeof pi.latest_charge === "string"
        ? await stripe.charges.retrieve(pi.latest_charge)
        : null;
    if (charge && charge.receipt_url) {
      receiptUrl = charge.receipt_url;
    }

    // Promote booking out of PENDING_PAYMENT
    const updated = await db.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED", // or "PENDING" if you gate on autoConfirm
        expiresAt: null, // clear hold
        receiptUrl: receiptUrl ?? undefined,
        amountDueCents:
          booking.amountDueCents ??
          (typeof pi.amount === "number" ? pi.amount : undefined),
        updatedAt: new Date(),
      },
      select: { status: true },
    });

    return NextResponse.json({ status: updated.status });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Finalize failed" },
      { status: 500 }
    );
  }
}
