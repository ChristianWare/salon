// src/app/api/book/set-tip/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const userId = (session.user as any).id || (session.user as any).userId;
  if (!userId)
    return NextResponse.json({ error: "user missing" }, { status: 400 });

  let body: { bookingId?: string; tipCents?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const bookingId = String(body.bookingId || "");
  const tipCentsRaw = Number(body.tipCents ?? 0);
  const tipCents = Number.isFinite(tipCentsRaw)
    ? Math.max(0, Math.round(tipCentsRaw))
    : 0;

  if (!bookingId)
    return NextResponse.json({ error: "missing bookingId" }, { status: 400 });

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      status: true,
      amountDueCents: true, // base (without tip)
      tipCents: true,
      paymentIntentId: true,
    },
  });

  if (!booking)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (booking.userId !== userId && (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (booking.status !== "PENDING_PAYMENT" || !booking.paymentIntentId) {
    return NextResponse.json(
      { error: "cannot tip on this booking" },
      { status: 400 }
    );
  }

  const baseAmount = booking.amountDueCents ?? 0;
  const newAmount = baseAmount + tipCents;

  try {
    await stripe.paymentIntents.update(booking.paymentIntentId, {
      amount: newAmount,
      metadata: { tipCents: String(tipCents) },
    });

    await db.booking.update({
      where: { id: booking.id },
      data: { tipCents },
    });

    return NextResponse.json({ tipCents, amountDueCents: newAmount });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "stripe error" },
      { status: 500 }
    );
  }
}
