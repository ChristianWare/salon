/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Adjust if your route is different (e.g. "/dashboard/billing")
// const BASE_PATH = "/dashboard/billing-and-receipts";
const TZ = process.env.SALON_TZ ?? "America/Phoenix";

type SearchParamsPromise = Promise<
  Record<string, string | string[] | undefined>
>;

/* ───────────── helpers ───────────── */
function getStr(
  sp: Record<string, string | string[] | undefined>,
  key: string,
  fallback = ""
) {
  const v = sp[key];
  return Array.isArray(v) ? (v[0] ?? fallback) : (v ?? fallback);
}
function buildHref(prev: URLSearchParams, next: Record<string, string | null>) {
  const q = new URLSearchParams(prev.toString());
  for (const [k, v] of Object.entries(next)) {
    if (v === null) q.delete(k);
    else q.set(k, v);
  }
  // return only query to preserve the current path (avoids 404s if route differs)
  return `?${q.toString()}`;
}
function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function subDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() - n);
  return x;
}
const toUSD = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

/* ───────────── page ───────────── */
export default async function BillingAndReceiptsPage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = session.user.id;

  // parse query
  const spObj = await searchParams;
  const sp = new URLSearchParams(
    Object.entries(spObj).reduce<Record<string, string>>((acc, [k, v]) => {
      if (Array.isArray(v)) acc[k] = v[0] ?? "";
      else if (v != null) acc[k] = v;
      return acc;
    }, {})
  );

  type Preset = "30d" | "90d" | "year" | "custom";
  const preset = (getStr(spObj, "preset") || "30d") as Preset;
  const fromQ = getStr(spObj, "from");
  const toQ = getStr(spObj, "to");
  const statusParam = (getStr(spObj, "status") || "COMPLETED") as
    | "COMPLETED"
    | "ALL";

  // date range
  const now = new Date();
  let fromDate: Date;
  let toDate: Date;
  if (preset === "custom" || fromQ || toQ) {
    fromDate = startOfDay(fromQ ? new Date(fromQ) : subDays(now, 29));
    toDate = endOfDay(toQ ? new Date(toQ) : now);
  } else if (preset === "90d") {
    fromDate = startOfDay(subDays(now, 89));
    toDate = endOfDay(now);
  } else if (preset === "year") {
    fromDate = startOfDay(new Date(now.getFullYear(), 0, 1));
    toDate = endOfDay(now);
  } else {
    // 30d default
    fromDate = startOfDay(subDays(now, 29));
    toDate = endOfDay(now);
  }
  const fromStr = toISODate(fromDate);
  const toStr = toISODate(toDate);

  // where
  const baseWhere: Prisma.BookingWhereInput = {
    userId: me,
    start: { gte: fromDate, lte: toDate },
  };
  const where: Prisma.BookingWhereInput =
    statusParam === "COMPLETED"
      ? { ...baseWhere, status: "COMPLETED" }
      : baseWhere;

  const orderBy: Prisma.BookingOrderByWithRelationInput = {
    start: "desc",
  } as const;

  // data
//   const page = 1; // keep it simple for now; add pagination later if needed
  const pageSize = 100;

  const [rows, totalsAll, totalsCompleted] = await db.$transaction([
    db.booking.findMany({
      where,
      orderBy,
      take: pageSize,
      include: {
        service: { select: { name: true } },
        groomer: { select: { user: { select: { name: true, email: true } } } },
      },
    }),
    db.booking.aggregate({
      where: baseWhere,
      _sum: { depositCents: true, tipCents: true },
      _count: { _all: true },
    }),
    db.booking.aggregate({
      where: { ...baseWhere, status: "COMPLETED" },
      _sum: { depositCents: true, tipCents: true },
      _count: { _all: true },
    }),
  ]);

  const dateFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const timeFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });

  const completedSum =
    (totalsCompleted._sum?.depositCents ?? 0) +
    (totalsCompleted._sum?.tipCents ?? 0);
  const allSum =
    (totalsAll._sum?.depositCents ?? 0) + (totalsAll._sum?.tipCents ?? 0);
  const completedCount = totalsCompleted._count?._all ?? 0;
  const allCount = totalsAll._count?._all ?? 0;

  return (
    <section style={{ padding: "2rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 12,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
          Billing & Receipts
        </h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href='/dashboard' style={outlineBtn}>
            Dashboard
          </Link>
          <Link href='/dashboard/bookings' style={outlineBtn}>
            My Bookings
          </Link>
          <Link href='/book' style={primaryBtn}>
            Book Appointment
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "end",
          marginBottom: 12,
        }}
      >
        <div>
          <label style={label}>From</label>
          <input type='date' name='from' defaultValue={fromStr} style={input} />
        </div>
        <div>
          <label style={label}>To</label>
          <input type='date' name='to' defaultValue={toStr} style={input} />
        </div>
        <input type='hidden' name='preset' value='custom' />
        <div>
          <label style={label}>Status</label>
          <select name='status' defaultValue={statusParam} style={select}>
            <option value='COMPLETED'>Completed only</option>
            <option value='ALL'>All statuses</option>
          </select>
        </div>
        <button type='submit' style={primaryBtn}>
          Apply
        </button>
        <Link href='?' style={outlineBtn}>
          Clear
        </Link>
      </form>

      {/* Preset pills */}
      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
      >
        <Pill
          href={buildHref(sp, { preset: "30d", from: null, to: null })}
          current={preset === "30d"}
          label='Last 30 days'
        />
        <Pill
          href={buildHref(sp, { preset: "90d", from: null, to: null })}
          current={preset === "90d"}
          label='Last 90 days'
        />
        <Pill
          href={buildHref(sp, { preset: "year", from: null, to: null })}
          current={preset === "year"}
          label='This year'
        />
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Card title='Completed total' value={toUSD(completedSum)} />
        <Card title='Completed count' value={completedCount.toLocaleString()} />
        <Card title='All total (in range)' value={toUSD(allSum)} />
        <Card title='All count (in range)' value={allCount.toLocaleString()} />
      </div>

      {/* Table */}
      <div
        style={{
          overflowX: "auto",
          border: "1px solid #e5e5e5",
          borderRadius: 8,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
          }}
        >
          <thead
            style={{
              position: "sticky",
              top: 0,
              background: "#fafafa",
              zIndex: 1,
            }}
          >
            <tr>
              <th style={th}>Date</th>
              <th style={th}>Time</th>
              <th style={th}>Service</th>
              <th style={th}>Groomer</th>
              <th style={th}>Deposit</th>
              <th style={th}>Tip</th>
              <th style={th}>Total</th>
              <th style={th}>Status</th>
              <th style={th}>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ padding: 16, textAlign: "center", color: "#666" }}
                >
                  No records for this view.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const d = new Date(r.start);
                const service = r.service?.name ?? "—";
                const groomer =
                  r.groomer?.user?.name ?? r.groomer?.user?.email ?? "—";
                const deposit = r.depositCents ?? 0;
                const tip = r.tipCents ?? 0;
                const total = deposit + tip;
                return (
                  <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={td}>{dateFmt.format(d)}</td>
                    <td style={td}>{timeFmt.format(d)}</td>
                    <td style={td}>{service}</td>
                    <td style={td}>{groomer}</td>
                    <td style={td}>{toUSD(deposit)}</td>
                    <td style={td}>{toUSD(tip)}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{toUSD(total)}</td>
                    <td style={td}>
                      <span style={statusPill(r.status)}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={td}>
                      {r.receiptUrl ? (
                        <a
                          href={r.receiptUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          style={{ color: "#0969da" }}
                        >
                          View
                        </a>
                      ) : (
                        <span style={{ color: "#666" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ───────────── UI bits / styles ───────────── */
function Pill({
  href,
  current,
  label,
}: {
  href: any;
  current?: boolean;
  label: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        textDecoration: "none",
        border: "1px solid #ddd",
        background: current ? "#111" : "white",
        color: current ? "white" : "#333",
        fontSize: 13,
      }}
    >
      {label}
    </Link>
  );
}
function Card({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
function statusPill(status: string): React.CSSProperties {
  const color =
    status === "COMPLETED"
      ? "#0366d6"
      : status === "CONFIRMED"
        ? "#0a7"
        : status === "PENDING"
          ? "#d88a00"
          : status === "CANCELED"
            ? "#999"
            : "#b33636"; // NO_SHOW
  return {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    color: "white",
    background: color,
    fontSize: 12,
  };
}

const label: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#666",
  marginBottom: 4,
};
const input: React.CSSProperties = {
  width: 180,
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
};
const select: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
  minWidth: 160,
};
const primaryBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  background: "#111",
  color: "white",
  border: "1px solid #111",
  cursor: "pointer",
  textDecoration: "none",
};
const outlineBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  background: "white",
  color: "#333",
  border: "1px solid #ddd",
  cursor: "pointer",
  textDecoration: "none",
};
const card: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 8,
  padding: 12,
  background: "white",
};
const th: React.CSSProperties = {
  borderBottom: "1px solid #e5e5e5",
  padding: 10,
  background: "#fafafa",
  textAlign: "left",
  position: "sticky",
  top: 0,
  zIndex: 1,
};
const td: React.CSSProperties = {
  borderBottom: "1px solid #f0f0f0",
  padding: 10,
};
