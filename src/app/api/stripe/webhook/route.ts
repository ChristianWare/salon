/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
  typescript: true,
});


export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig)
    return NextResponse.json({ error: "No signature" }, { status: 400 });

  const whsec = process.env.STRIPE_WEBHOOK_SECRET!;
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whsec);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature failed: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;

        // 1) Find the booking we created in /api/book/prepare
        const booking = await db.booking.findFirst({
          where: { paymentIntentId: pi.id },
          include: {
            groomer: { select: { autoConfirm: true } },
          },
        });
        if (!booking) break; // nothing to update

        // 2) Pull receipt URL if available
        let receiptUrl: string | null = null;
        if (pi.latest_charge && typeof pi.latest_charge === "string") {
          const charge = await stripe.charges.retrieve(pi.latest_charge);
          receiptUrl = charge.receipt_url ?? null;
        } else if (
          typeof pi.latest_charge === "object" &&
          pi.latest_charge?.receipt_url
        ) {
          receiptUrl = pi.latest_charge.receipt_url;
        }

        // 3) Choose the final status
        const nextStatus = booking.groomer?.autoConfirm
          ? "CONFIRMED"
          : "PENDING";

        await db.booking.update({
          where: { id: booking.id },
          data: {
            status: nextStatus,
            receiptUrl: receiptUrl ?? booking.receiptUrl,
            // depositCents can be the amount of the PaymentIntent if that's your “due now”
            depositCents: Number.isFinite(pi.amount_received)
              ? pi.amount_received
              : booking.depositCents,
            // (optional) tipCents could be handled later at completion
          },
        });
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        // Mark booking as canceled or revert the hold, if you want:
        const booking = await db.booking.findFirst({
          where: { paymentIntentId: pi.id },
        });
        if (booking) {
          await db.booking.update({
            where: { id: booking.id },
            data: { status: "CANCELED" },
          });
        }
        break;
      }

      // (Optional) handle other events you care about
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    // If something goes wrong in your handler, return 200 so Stripe doesn't infinitely retry,
    // but do log the error somewhere useful.
    console.error("Webhook handler error:", e);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
