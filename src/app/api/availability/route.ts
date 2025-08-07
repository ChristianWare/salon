import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";

export const runtime = "nodejs"; // need DB

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");
  const groomerId = searchParams.get("groomerId");
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!serviceId || !groomerId || !date) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const slots = await getAvailableSlots({ serviceId, groomerId, date });
  return NextResponse.json(slots);
}
