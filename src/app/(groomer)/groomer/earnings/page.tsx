/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { db } from "@/lib/db";
import { requireGroomer } from "@/lib/rbac";
import { startOfDay, endOfDay, addDays, startOfMonth } from "date-fns";

type SearchParamsPromise = Promise<
  Record<string, string | string[] | undefined>
>;

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TZ = process.env.SALON_TZ ?? "America/Phoenix";

function toUSD(cents?: number | null) {
  return (cents ?? 0 / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}
function usdFromCents(n?: number | null) {
  return ((n ?? 0) / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
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

  const baseWhere: any = { groomerId: user.id, status: "COMPLETED" };
  const where =
    from && to ? { ...baseWhere, start: { gte: from, lte: to } } : baseWhere;

  const [agg, count, rows] = await Promise.all([
    db.booking.aggregate({
      where,
      _sum: { depositCents: true, tipCents: true },
    }),
    db.booking.count({ where }),
    db.booking.findMany({
      where,
      include: {
        service: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { start: "desc" },
      take: 50,
    }),
  ]);

  const grossCents = (agg._sum.depositCents ?? 0) + (agg._sum.tipCents ?? 0);

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
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Earnings</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href='/groomer' style={outlineBtn}>
            Dashboard
          </Link>
          <Link href='/groomer/my-bookings' style={outlineBtn}>
            My Bookings
          </Link>
        </div>
      </div>
      <p style={{ marginTop: 0, color: "#666" }}>{label}</p>

      {/* Filters */}
      <nav
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          margin: "12px 0 16px",
        }}
      >
        <Pill
          href='/groomer/earnings?range=today'
          current={rangeParam === "today"}
        >
          Today
        </Pill>
        <Pill href='/groomer/earnings?range=7d' current={rangeParam === "7d"}>
          Last 7 Days
        </Pill>
        <Pill href='/groomer/earnings?range=mtd' current={rangeParam === "mtd"}>
          Month to Date
        </Pill>
        <Pill href='/groomer/earnings' current={!rangeParam}>
          All Time
        </Pill>
        <span style={{ flex: 1 }} />
        <Link
          href={`/groomer/earnings/export${rangeParam ? `?range=${encodeURIComponent(rangeParam)}` : ""}`}
          style={exportBtn}
        >
          Export CSV
        </Link>
      </nav>

      {/* KPI cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Kpi label='Completed Appointments' value={count.toLocaleString()} />
        <Kpi label='Tips' value={usdFromCents(agg._sum.tipCents)} />
        <Kpi
          label='Service Revenue'
          value={usdFromCents(agg._sum.depositCents)}
        />
        <Kpi label='Gross (Revenue + Tips)' value={usdFromCents(grossCents)} />
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
              <th style={th}>Customer</th>
              <th style={th}>Deposit</th>
              <th style={th}>Tip</th>
              <th style={th}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ padding: 16, textAlign: "center", color: "#666" }}
                >
                  No completed appointments in this range.
                </td>
              </tr>
            ) : (
              rows.map((b) => {
                const d = new Date(b.start);
                const totalCents = (b.depositCents ?? 0) + (b.tipCents ?? 0);
                return (
                  <tr key={b.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={td}>{dateFmt.format(d)}</td>
                    <td style={td}>{timeFmt.format(d)}</td>
                    <td style={td}>{b.service?.name ?? "—"}</td>
                    <td style={td}>
                      {b.user?.name ?? "—"}
                      <br />
                      <small style={{ color: "#666" }}>{b.user?.email}</small>
                    </td>
                    <td style={td}>{usdFromCents(b.depositCents)}</td>
                    <td style={td}>{usdFromCents(b.tipCents)}</td>
                    <td style={{ ...td, fontWeight: 600 }}>
                      {usdFromCents(totalCents)}
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

/* Small UI helpers */
function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={card}>
      <div style={{ color: "#666", fontSize: 12, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function Pill({
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
        borderRadius: 999,
        textDecoration: "none",
        border: "1px solid #ddd",
        background: current ? "#111" : "white",
        color: current ? "white" : "#333",
        fontSize: 13,
      }}
    >
      {children}
    </Link>
  );
}

/* Shared inline styles (match your pattern) */
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

const outlineBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  background: "white",
  color: "#333",
  border: "1px solid #ddd",
  cursor: "pointer",
  textDecoration: "none",
};

const exportBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  textDecoration: "none",
  border: "1px solid #0366d6",
  color: "#0366d6",
  background: "white",
  cursor: "pointer",
  fontWeight: 600,
};
