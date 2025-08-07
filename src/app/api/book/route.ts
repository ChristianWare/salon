import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { serviceId, groomerId, start } = await req.json();
  const service = await db.service.findUnique({ where: { id: serviceId } });
  if (!service)
    return NextResponse.json({ error: "bad service" }, { status: 400 });

  const startDate = new Date(start);
  const endDate = new Date(
    startDate.getTime() + service.durationMin * 60 * 1000
  );

  if (!session.user.id) {
    return NextResponse.json({ error: "User ID missing" }, { status: 400 });
  }

  await db.booking.create({
    data: {
      userId: session.user.id as string,
      serviceId,
      groomerId,
      start: startDate,
      end: endDate,
      depositCents: 0,
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true });
}
