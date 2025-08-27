// src/app/api/book/status/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId") || "";
  if (!bookingId)
    return NextResponse.json({ error: "missing id" }, { status: 400 });

  const b = await db.booking.findUnique({
    where: { id: bookingId },
    select: { status: true, receiptUrl: true, paymentIntentId: true },
  });
  if (!b) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({
    status: b.status,
    receiptUrl: b.receiptUrl,
    paymentIntentId: b.paymentIntentId,
  });
}
