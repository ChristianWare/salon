// app/api/book/cancel/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

type Body = {
  bookingId?: string;
  reason?: string;
  actor?: "user" | "admin"; // who initiated the cancellation
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

// helper to tack a line onto notes
function appendNote(existing: string | null | undefined, line?: string | null) {
  const add = (line ?? "").trim();
  if (!add) return existing ?? null;
  return existing ? `${existing}\n${add}` : add;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const actor = body.actor ?? "user";
  const { bookingId, reason } = body;
  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
  }

  // If admin, enforce role; if user, we’ll enforce ownership + window below.
  if (actor === "admin" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Load booking
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: { select: { name: true, priceCents: true } },
    },
  });
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Guard: user cancellations must own the booking
  if (actor === "user") {
    const userId = (session.user as any).id;
    if (!userId || booking.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  // Cancellation policy window (hours) — default 48 (keeps your original behavior)
  const cfg = await db.config.findUnique({
    where: { key: "cancelWindow" },
    select: { value: true },
  });
  const cancelWindowHours = Number(cfg?.value ?? 48);

  const now = new Date();
  const start = new Date(booking.start);
  const cutoff = new Date(start.getTime() - cancelWindowHours * 60 * 60 * 1000);

  // For user-initiated cancels, enforce refundable statuses + window (original logic)
  const refundableStatus =
    booking.status === "PENDING" || booking.status === "CONFIRMED";

  if (actor === "user") {
    if (!refundableStatus) {
      return NextResponse.json(
        { error: "This booking cannot be canceled/refunded." },
        { status: 400 }
      );
    }
    if (!(start > now && now <= cutoff)) {
      return NextResponse.json(
        {
          error: `Cancellations must be at least ${cancelWindowHours} hours before the start time.`,
        },
        { status: 400 }
      );
    }
  }

  // If already canceled, return early but still surface any refund info below if desired
  const alreadyCanceled = booking.status === "CANCELED";

  // If there was no online charge, just mark canceled
  if (!booking.paymentIntentId) {
    if (!alreadyCanceled) {
      await db.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELED",
          notes: appendNote(
            booking.notes,
            reason ?? `Canceled by ${actor}. No online charge to refund.`
          ),
        },
      });
    }
    return NextResponse.json({
      ok: true,
      refunded: 0,
      note: "No PaymentIntent found; canceled only.",
      alreadyCanceled,
    });
  }

  // Refund the remaining captured amount on the PaymentIntent (safest across all flows)
  const pi = await stripe.paymentIntents.retrieve(booking.paymentIntentId);
  const amountReceived = pi.amount_received ?? 0;

  const refundsList = await stripe.refunds.list({
    payment_intent: booking.paymentIntentId,
    limit: 100,
  });
  const alreadyRefunded = refundsList.data.reduce(
    (sum, r) => sum + (r.amount ?? 0),
    0
  );
  const remaining = Math.max(0, amountReceived - alreadyRefunded);

  let refundId: string | null = null;
  let refunded = 0;

  if (remaining > 0 && !alreadyCanceled) {
    const refund = await stripe.refunds.create({
      payment_intent: booking.paymentIntentId,
      amount: remaining,
      reason: "requested_by_customer",
      metadata: {
        bookingId: booking.id,
        actor, // "user" or "admin"
        userId: booking.userId,
        note: reason ?? "",
      },
    });
    refundId = refund.id;
    refunded = refund.amount ?? remaining;
  }

  // Persist cancellation (idempotent if already canceled)
  if (!alreadyCanceled) {
    await db.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELED",
        notes: appendNote(
          booking.notes,
          reason ?? `Canceled by ${actor}${refunded ? " • refund issued" : ""}.`
        ),
      },
    });
  }

  return NextResponse.json({
    ok: true,
    bookingId: booking.id,
    refunded,
    refundId,
    alreadyCanceled,
  });
}
