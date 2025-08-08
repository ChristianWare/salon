/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { db } from "@/lib/db";
import { requireGroomer } from "@/lib/rbac";
import { startOfDay, endOfDay, addDays, startOfMonth } from "date-fns";

type SearchParamsPromise = Promise<{
  [key: string]: string | string[] | undefined;
}>;
export const dynamic = "force-dynamic";

function cents(n?: number | null) {
  return ((n ?? 0) / 100).toFixed(2);
}

function parseRange(range?: string) {
  const now = new Date();
  if (range === "today") {
    return { from: startOfDay(now), to: endOfDay(now), label: "Today" };
  }
  if (range === "7d") {
    return {
      from: startOfDay(addDays(now, -6)),
      to: endOfDay(now),
      label: "Last 7 Days",
    };
  }
  if (range === "mtd") {
    return {
      from: startOfMonth(now),
      to: endOfDay(now),
      label: "Month to Date",
    };
  }
  return {
    from: undefined as Date | undefined,
    to: undefined as Date | undefined,
    label: "All Time",
  };
}

export default async function EarningsPage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  const user = await requireGroomer();
  const sp = await searchParams;
  const rangeParam = Array.isArray(sp?.range) ? sp?.range[0] : sp?.range;
  const { from, to, label } = parseRange(rangeParam);

  // Base where for completed bookings by this groomer
  const baseWhere: any = { groomerId: user.id, status: "COMPLETED" };
  const where =
    from && to ? { ...baseWhere, start: { gte: from, lte: to } } : baseWhere;

  // KPIs
  const [agg, count] = await Promise.all([
    db.booking.aggregate({
      where,
      _sum: { depositCents: true, tipCents: true },
    }),
    db.booking.count({ where }),
  ]);

  // Recent rows (limit 50)
  const rows = await db.booking.findMany({
    where,
    include: {
      service: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { start: "desc" },
    take: 50,
  });

  const gross = (agg._sum.depositCents ?? 0) + (agg._sum.tipCents ?? 0);

  return (
    <section style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: 8 }}>Earnings</h1>
      <p style={{ marginTop: 0, color: "#666" }}>{label}</p>

      {/* Filters */}
      <nav
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          margin: "12px 0 20px",
        }}
      >
        <FilterLink
          href='/groomer/earnings?range=today'
          current={rangeParam === "today"}
        >
          Today
        </FilterLink>
        <FilterLink
          href='/groomer/earnings?range=7d'
          current={rangeParam === "7d"}
        >
          Last 7 Days
        </FilterLink>
        <FilterLink
          href='/groomer/earnings?range=mtd'
          current={rangeParam === "mtd"}
        >
          Month to Date
        </FilterLink>
        <FilterLink href='/groomer/earnings' current={!rangeParam}>
          All Time
        </FilterLink>
        <span style={{ flex: 1 }} />
        {/* CSV Export */}
        <Link
          href={`/groomer/earnings/export${rangeParam ? `?range=${encodeURIComponent(rangeParam)}` : ""}`}
          style={exportBtn}
        >
          Export CSV
        </Link>
      </nav>

      {/* KPI cards */}
      <div
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}
      >
        <Kpi label='Completed Appointments' value={count} />
        <Kpi label='Tips' value={`$${cents(agg._sum.tipCents)}`} />
        <Kpi
          label='Service Revenue'
          value={`$${cents(agg._sum.depositCents)}`}
        />
        <Kpi label='Gross (Revenue + Tips)' value={`$${cents(gross)}`} />
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <TH>Date</TH>
              <TH>Time</TH>
              <TH>Service</TH>
              <TH>Customer</TH>
              <TH>Deposit</TH>
              <TH>Tip</TH>
              <TH>Total</TH>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <TD colSpan={7} style={{ textAlign: "center" }}>
                  No completed appointments in this range.
                </TD>
              </tr>
            ) : (
              rows.map((b) => {
                const d = new Date(b.start);
                const dateStr = d.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const timeStr = d.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const total = (b.depositCents ?? 0) + (b.tipCents ?? 0);
                return (
                  <tr key={b.id}>
                    <TD>{dateStr}</TD>
                    <TD>{timeStr}</TD>
                    <TD>{b.service.name}</TD>
                    <TD>
                      {b.user.name ?? "—"}
                      <br />
                      <small>{b.user.email}</small>
                    </TD>
                    <TD>${cents(b.depositCents)}</TD>
                    <TD>${cents(b.tipCents)}</TD>
                    <TD>${cents(total)}</TD>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Future: show payout status when Stripe Connect is added */}
    </section>
  );
}

/* Small UI helpers */
function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: 8,
        padding: "12px 14px",
        minWidth: 220,
      }}
    >
      <div style={{ color: "#666", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function FilterLink({
  href,
  current,
  children,
}: {
  href: string;
  current?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: "6px 10px",
        borderRadius: 6,
        textDecoration: "none",
        border: "1px solid #ddd",
        background: current ? "#e6f0ff" : "white",
      }}
    >
      {children}
    </Link>
  );
}

function TH({ children }: { children: React.ReactNode }) {
  return <th style={th}>{children}</th>;
}
function TD({
  children,
  colSpan,
  style,
}: {
  children: React.ReactNode;
  colSpan?: number;
  style?: React.CSSProperties;
}) {
  return (
    <td colSpan={colSpan} style={{ ...td, ...(style || {}) }}>
      {children}
    </td>
  );
}

const th: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 8,
  background: "#fafafa",
};
const td: React.CSSProperties = { border: "1px solid #ddd", padding: 8 };

const exportBtn: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  textDecoration: "none",
  border: "1px solid #0366d6",
  color: "#0366d6",
  fontWeight: 600,
};
