// src/app/api/book/expire/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const auth = req.headers.get("x-cron-secret");
  if (auth !== process.env.CRON_SECRET)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const now = new Date();
  const stale = await db.booking.findMany({
    where: {
      status: "PENDING_PAYMENT",
      expiresAt: { lt: now },
    },
    select: { id: true, paymentIntentId: true },
  });

  for (const b of stale) {
    if (b.paymentIntentId) {
      try {
        await stripe.paymentIntents.cancel(b.paymentIntentId);
      } catch {}
    }
    await db.booking.update({
      where: { id: b.id },
      data: { status: "CANCELED" },
    });
  }

  return NextResponse.json({ released: stale.length });
}
