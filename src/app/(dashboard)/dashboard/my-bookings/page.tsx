/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import CancelBookingForm from "@/components/dashboard/CancelBookingForm/CancelBookingForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_PATH = "/dashboard/my-bookings";
const TZ = process.env.SALON_TZ ?? "America/Phoenix";

/* ───────────────── helpers ───────────────── */
type SearchParamsPromise = Promise<
  Record<string, string | string[] | undefined>
>;

function getStr(
  sp: Record<string, string | string[] | undefined>,
  key: string,
  fallback = ""
) {
  const v = sp[key];
  return Array.isArray(v) ? (v[0] ?? fallback) : (v ?? fallback);
}

function getNum(
  sp: Record<string, string | string[] | undefined>,
  key: string,
  fallback: number
) {
  const n = Number(getStr(sp, key, ""));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function buildHref(prev: URLSearchParams, next: Record<string, string | null>) {
  const q: Record<string, string> = Object.fromEntries(prev.entries());
  for (const [k, v] of Object.entries(next)) {
    if (v === null) delete q[k];
    else q[k] = v;
  }
  return { pathname: BASE_PATH, query: q } as const;
}

/* ───────────────── page ───────────────── */
export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = session.user.id;

  const spObj = await searchParams;
  const sp = new URLSearchParams(
    Object.entries(spObj).reduce<Record<string, string>>((acc, [k, v]) => {
      if (Array.isArray(v)) acc[k] = v[0] ?? "";
      else if (v != null) acc[k] = v;
      return acc;
    }, {})
  );

  type Filter =
    | "upcoming"
    | "pending"
    | "confirmed"
    | "completed"
    | "canceled"
    | "no_show"
    | "past"
    | "all";

  const filter = (getStr(spObj, "filter") || "upcoming") as Filter;
  const page = Math.max(1, getNum(spObj, "page", 1));
  const pageSize = Math.min(50, getNum(spObj, "pageSize", 10));

  const now = new Date();

  // Build where based on filter
  const baseWhere: Prisma.BookingWhereInput = { userId: me };
  let where: Prisma.BookingWhereInput = { ...baseWhere };

  switch (filter) {
    case "pending":
      where = { ...baseWhere, status: "PENDING", start: { gte: now } };
      break;
    case "confirmed":
      where = { ...baseWhere, status: "CONFIRMED", start: { gte: now } };
      break;
    case "completed":
      where = { ...baseWhere, status: "COMPLETED" };
      break;
    case "canceled":
      where = { ...baseWhere, status: "CANCELED" };
      break;
    case "no_show":
      where = { ...baseWhere, status: "NO_SHOW" };
      break;
    case "past":
      where = { ...baseWhere, start: { lt: now } };
      break;
    case "all":
      where = { ...baseWhere };
      break;
    case "upcoming":
    default:
      where = {
        ...baseWhere,
        start: { gte: now },
        status: { in: ["PENDING", "CONFIRMED"] },
      };
      break;
  }

  const orderBy: Prisma.BookingOrderByWithRelationInput =
    filter === "upcoming" || filter === "pending" || filter === "confirmed"
      ? ({ start: "asc" } as const)
      : ({ start: "desc" } as const);

  // 1) Fetch rows
  const bookings = await db.booking.findMany({
    where,
    orderBy,
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      service: { select: { name: true, durationMin: true } },
      groomer: { select: { user: { select: { name: true, email: true } } } },
    },
  });

  // 2) Aggregates
  const [total, statusCounts, upcomingCount, pastCount] = await db.$transaction(
    [
      db.booking.count({ where }),
      db.booking.groupBy({
        by: ["status"],
        where: baseWhere,
        orderBy: { status: "asc" },
        _count: { _all: true },
      }),
      db.booking.count({
        where: {
          ...baseWhere,
          start: { gte: now },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      }),
      db.booking.count({ where: { ...baseWhere, start: { lt: now } } }),
    ]
  );

  const pages = Math.max(1, Math.ceil(total / pageSize));

  const statusMap = Object.fromEntries(
    statusCounts.map((s) => [
      String(s.status),
      typeof s._count === "object" && s._count ? (s._count._all ?? 0) : 0,
    ])
  );

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
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
          My Bookings
        </h1>
        <div style={{ fontSize: 14, color: "#666" }}>
          {total.toLocaleString()} result{total === 1 ? "" : "s"}
        </div>
      </div>

      {/* Quick filter pills */}
      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
      >
        <Pill
          href={buildHref(sp, { filter: "upcoming", page: "1" })}
          current={filter === "upcoming"}
          label={`Upcoming (${upcomingCount})`}
        />
        <Pill
          href={buildHref(sp, { filter: "pending", page: "1" })}
          current={filter === "pending"}
          label={`Pending (${statusMap["PENDING"] ?? 0})`}
        />
        <Pill
          href={buildHref(sp, { filter: "confirmed", page: "1" })}
          current={filter === "confirmed"}
          label={`Confirmed (${statusMap["CONFIRMED"] ?? 0})`}
        />
        <Pill
          href={buildHref(sp, { filter: "completed", page: "1" })}
          current={filter === "completed"}
          label={`Completed (${statusMap["COMPLETED"] ?? 0})`}
        />
        <Pill
          href={buildHref(sp, { filter: "canceled", page: "1" })}
          current={filter === "canceled"}
          label={`Canceled (${statusMap["CANCELED"] ?? 0})`}
        />
        <Pill
          href={buildHref(sp, { filter: "no_show", page: "1" })}
          current={filter === "no_show"}
          label={`No-Show (${statusMap["NO_SHOW"] ?? 0})`}
        />
        <Pill
          href={buildHref(sp, { filter: "past", page: "1" })}
          current={filter === "past"}
          label={`Past (${pastCount})`}
        />
        <Pill
          href={buildHref(sp, { filter: "all", page: "1" })}
          current={filter === "all"}
          label={`All (${Object.values(statusMap).reduce((a, b) => a + (b as number), 0)})`}
        />
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
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ padding: 16, textAlign: "center", color: "#666" }}
                >
                  No bookings for this view.
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const start = new Date(b.start);
                const dateStr = dateFmt.format(start);
                const timeStr = timeFmt.format(start);
                const canCancel =
                  (b.status === "PENDING" || b.status === "CONFIRMED") &&
                  start > new Date();

                return (
                  <tr key={b.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={td}>{dateStr}</td>
                    <td style={td}>{timeStr}</td>
                    <td style={td}>
                      {b.service?.name ?? "—"}{" "}
                      {b.service?.durationMin ? (
                        <small>({b.service.durationMin}m)</small>
                      ) : null}
                    </td>
                    <td style={td}>
                      {b.groomer?.user?.name ?? b.groomer?.user?.email ?? "—"}
                    </td>
                    <td style={td}>
                      <span style={statusPill(b.status)}>
                        {b.status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={td}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <Link
                          href={`${BASE_PATH}/${b.id}`}
                          style={{ color: "#0969da", textDecoration: "none" }}
                        >
                          View
                        </Link>
                        {canCancel ? (
                          <CancelBookingForm bookingId={b.id} />
                        ) : (
                          <span style={{ color: "#666" }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
        }}
      >
        <div style={{ fontSize: 14, color: "#666" }}>
          Showing{" "}
          {total === 0
            ? "0"
            : `${(page - 1) * pageSize + 1}–${Math.min(
                page * pageSize,
                total
              )}`}{" "}
          of {total}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {page <= 1 ? (
            <span
              style={{ ...outlineBtn, opacity: 0.5, pointerEvents: "none" }}
            >
              Previous
            </span>
          ) : (
            <Link
              href={buildHref(sp, { page: String(page - 1) })}
              style={outlineBtn}
            >
              Previous
            </Link>
          )}
          {page >= pages ? (
            <span
              style={{ ...outlineBtn, opacity: 0.5, pointerEvents: "none" }}
            >
              Next
            </span>
          ) : (
            <Link
              href={buildHref(sp, { page: String(page + 1) })}
              style={outlineBtn}
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/* ───────────── UI bits ───────────── */

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

function statusPill(status: string): React.CSSProperties {
  const color =
    status === "CONFIRMED"
      ? "#0a7"
      : status === "PENDING"
        ? "#d88a00"
        : status === "COMPLETED"
          ? "#0366d6"
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

/* ───────────── shared inline styles ───────────── */
const outlineBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  background: "white",
  color: "#333",
  border: "1px solid #ddd",
  cursor: "pointer",
  textDecoration: "none",
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
