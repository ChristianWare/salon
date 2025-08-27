import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { addMonths, startOfMonth } from "date-fns";

// GET /api/admin/bookings/month?month=YYYY-MM
export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month"); // "2025-08"
  const now = new Date();

  let monthStart: Date;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    monthStart = new Date(y, m - 1, 1);
  } else {
    monthStart = startOfMonth(now);
  }
  const monthEnd = addMonths(monthStart, 1); // exclusive upper bound

  const rows = await db.booking.findMany({
    where: {
      start: { gte: monthStart, lt: monthEnd },
    },
    select: {
      id: true,
      start: true,
      end: true,
      status: true,
      service: { select: { name: true } },
      user: { select: { name: true, email: true } },
      groomer: { select: { user: { select: { name: true, email: true } } } },
    },
    orderBy: { start: "asc" },
    take: 2000, // safety cap
  });

  const bookings = rows.map((r) => ({
    id: r.id,
    start: r.start.toISOString(),
    end: r.end ? r.end.toISOString() : null,
    status: r.status,
    serviceName: r.service?.name ?? null,
    userName: r.user?.name ?? r.user?.email ?? null,
    groomerName: r.groomer?.user?.name ?? r.groomer?.user?.email ?? null,
  }));

  return NextResponse.json({ bookings });
}
