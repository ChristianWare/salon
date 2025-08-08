/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/groomer/earnings/export/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireGroomer } from "@/lib/rbac";
import { startOfDay, endOfDay, addDays, startOfMonth } from "date-fns";

function csvEscape(s: string) {
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function parseRange(range?: string) {
  const now = new Date();
  if (range === "today") {
    return { from: startOfDay(now), to: endOfDay(now) };
  }
  if (range === "7d") {
    return { from: startOfDay(addDays(now, -6)), to: endOfDay(now) };
  }
  if (range === "mtd") {
    return { from: startOfMonth(now), to: endOfDay(now) };
  }
  return {
    from: undefined as Date | undefined,
    to: undefined as Date | undefined,
  };
}

export async function GET(req: Request) {
  const user = await requireGroomer();

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || undefined;
  const { from, to } = parseRange(range);

  const baseWhere: any = { groomerId: user.id, status: "COMPLETED" };
  const where =
    from && to ? { ...baseWhere, start: { gte: from, lte: to } } : baseWhere;

  const rows = await db.booking.findMany({
    where,
    include: {
      service: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { start: "desc" },
    take: 2000,
  });

  const header = [
    "Date",
    "Time",
    "Service",
    "Customer Name",
    "Customer Email",
    "Deposit ($)",
    "Tip ($)",
    "Total ($)",
  ];

  const body = rows.map((b) => {
    const d = new Date(b.start);
    const dateStr = d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const timeStr = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dep = ((b.depositCents ?? 0) / 100).toFixed(2);
    const tip = ((b.tipCents ?? 0) / 100).toFixed(2);
    const total = (((b.depositCents ?? 0) + (b.tipCents ?? 0)) / 100).toFixed(
      2
    );

    return [
      csvEscape(dateStr),
      csvEscape(timeStr),
      csvEscape(b.service.name),
      csvEscape(b.user.name ?? ""),
      csvEscape(b.user.email ?? ""),
      dep,
      tip,
      total,
    ].join(",");
  });

  const csv = [header.join(","), ...body].join("\n");
  const filename = `earnings${range ? `_${range}` : ""}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
