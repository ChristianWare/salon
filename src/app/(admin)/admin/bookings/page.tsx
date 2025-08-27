/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Adjust to your local salon timezone if needed
const TZ = process.env.SALON_TZ ?? "America/Phoenix";
const BASE_PATH = "/admin/bookings";

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
/** Build a Link href that keeps us on /admin/bookings and merges query params */
function buildHref(prev: URLSearchParams, next: Record<string, string | null>) {
  const q: Record<string, string> = Object.fromEntries(prev.entries());
  for (const [k, v] of Object.entries(next)) {
    if (v === null) delete q[k];
    else q[k] = v;
  }
  return { pathname: BASE_PATH, query: q } as const;
}

export default async function BookingPage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  // 1) Admin guard
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // 2) Parse filters/pagination/sorting (Next 15: searchParams is async)
  const spObj = await searchParams;
  const sp = new URLSearchParams(
    Object.entries(spObj).reduce<Record<string, string>>((acc, [k, v]) => {
      if (Array.isArray(v)) acc[k] = v[0] ?? "";
      else if (v != null) acc[k] = v;
      return acc;
    }, {})
  );

  const page = Math.max(1, getNum(spObj, "page", 1));
  const pageSize = Math.min(100, getNum(spObj, "pageSize", 20));

  const q = getStr(spObj, "q").trim();
  const status = getStr(spObj, "status").trim();
  const groomerId = getStr(spObj, "groomerId").trim();
  const serviceId = getStr(spObj, "serviceId").trim();
  const from = getStr(spObj, "from").trim(); // ISO date or YYYY-MM-DD
  const to = getStr(spObj, "to").trim();

  const sort = getStr(spObj, "sort") || "start";
  const order = (getStr(spObj, "order") || "desc") as "asc" | "desc";

  const where: Prisma.BookingWhereInput = {};

  if (status) where.status = status as any;
  if (groomerId) where.groomerId = groomerId;
  if (serviceId) where.serviceId = serviceId;

  if (from || to) {
    where.start = {};
    if (from) where.start.gte = new Date(from);
    if (to) {
      const end =
        to.length <= 10 ? new Date(`${to}T23:59:59.999Z`) : new Date(to);
      where.start.lte = end;
    }
  }

  if (q) {
    where.OR = [
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { service: { name: { contains: q, mode: "insensitive" } } },
      { groomerId: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy =
    sort === "createdAt"
      ? { createdAt: order }
      : sort === "status"
        ? { status: order }
        : { start: order }; // default

  // 3) Fetch data
  const [bookings, total, groomers, services, statusCounts] =
    await db.$transaction([
      db.booking.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { name: true, email: true } }, // customer
          groomer: {
            include: {
              user: { select: { name: true, email: true } }, // <-- groomer name here
            },
          },
          service: { select: { name: true } },
        },
      }),
      db.booking.count({ where }),
      db.groomer.findMany({ orderBy: { id: "asc" }, select: { id: true } }),
      db.service.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      db.booking.groupBy({
        by: ["status"],
        where,
        orderBy: { status: "asc" },
        _count: { _all: true },
      }),
    ]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

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

  const statusCountMap = Object.fromEntries(
    statusCounts.map((s) => [
      String(s.status),
      typeof s._count === "object" && s._count ? (s._count._all ?? 0) : 0,
    ])
  );

  return (
    <section style={{ padding: "2rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: "1rem",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Bookings</h1>
        <div style={{ fontSize: 14, color: "#666" }}>
          {total.toLocaleString()} result{total === 1 ? "" : "s"}
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
        <div style={{ minWidth: 240, flex: "1 1 260px" }}>
          <input
            type='text'
            name='q'
            defaultValue={q}
            placeholder='Search name, email, service, groomer id...'
            style={input}
          />
        </div>

        <div style={{ minWidth: 180 }}>
          <select name='status' defaultValue={status} style={select}>
            <option value=''>All statuses</option>
            {Object.keys(statusCountMap)
              .sort()
              .map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
          </select>
        </div>

        <div style={{ minWidth: 160 }}>
          <select name='groomerId' defaultValue={groomerId} style={select}>
            <option value=''>All groomers</option>
            {groomers.map((g) => (
              <option key={g.id} value={g.id}>
                {g.id}
              </option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: 160 }}>
          <select name='serviceId' defaultValue={serviceId} style={select}>
            <option value=''>All services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input type='date' name='from' defaultValue={from} style={input} />
          <input type='date' name='to' defaultValue={to} style={input} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <select name='sort' defaultValue={sort} style={select}>
            <option value='start'>Sort by Start</option>
            <option value='createdAt'>Sort by Created</option>
            <option value='status'>Sort by Status</option>
          </select>
          <select name='order' defaultValue={order} style={select}>
            <option value='desc'>Desc</option>
            <option value='asc'>Asc</option>
          </select>
        </div>

        <input type='hidden' name='page' value='1' />
        <input type='hidden' name='pageSize' value={pageSize} />

        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button type='submit' style={primaryBtn}>
            Apply
          </button>
          <Link href={{ pathname: BASE_PATH, query: {} }} style={outlineBtn}>
            Clear
          </Link>
        </div>
      </form>

      {/* Status quick filters (pills) */}
      {Object.keys(statusCountMap).length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Pill
            href={buildHref(sp, { status: null, page: "1" })}
            current={!status}
            label={`All (${total})`}
          />
          {Object.entries(statusCountMap).map(([s, c]) => (
            <Pill
              key={s}
              href={buildHref(sp, { status: s, page: "1" })}
              current={status === s}
              label={
                <>
                  {s} <span style={{ marginLeft: 6, opacity: 0.9 }}>({c})</span>
                </>
              }
            />
          ))}
        </div>
      )}

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
              <Th
                sp={sp}
                label='Date'
                sortKey='start'
                sort={sort}
                order={order}
              />
              <th style={th}>Time</th>
              {/* NEW: Booked (createdAt) sortable column */}
              <Th
                sp={sp}
                label='Booked'
                sortKey='createdAt'
                sort={sort}
                order={order}
              />
              <th style={th}>Customer</th>
              <th style={th}>Groomer</th>
              <th style={th}>Service</th>
              <Th
                sp={sp}
                label='Status'
                sortKey='status'
                sort={sort}
                order={order}
              />
              <th style={th}>Details</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{ padding: 16, textAlign: "center", color: "#666" }}
                >
                  No bookings match your filters.
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const dt = new Date(b.start);
                const created = new Date(b.createdAt);

                const date = dateFmt.format(dt);
                const time = timeFmt.format(dt);
                const bookedDate = dateFmt.format(created);
                const bookedTime = timeFmt.format(created);

                const customer = b.user?.name || b.user?.email || "—";
                // const groomer = b.groomer?.id || "—";
                const service = b.service?.name || "—";

                const groomerName =
                  b.groomer?.user?.name || b.groomer?.user?.email || "—";
                return (
                  <tr key={b.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={td}>{date}</td>
                    <td style={td}>{time}</td>
                    {/* NEW: createdAt cell */}
                    <td style={td}>
                      {bookedDate}{" "}
                      <small style={{ color: "#666" }}>{bookedTime}</small>
                    </td>
                    <td style={td}>{customer}</td>
                    <td style={td}>{groomerName}</td>
                    <td style={td}>{service}</td>
                    <td style={td}>
                      <StatusBadge status={b.status as any} />
                    </td>
                    <td style={td}>
                      <Link
                        href={{ pathname: `${BASE_PATH}/${b.id}` }}
                        style={{ color: "#0969da" }}
                      >
                        View
                      </Link>
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
            : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`}{" "}
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

/* ───────────── UI helpers ───────────── */

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

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "CONFIRMED"
      ? "#0a7"
      : status === "PENDING" || status === "PENDING_PAYMENT"
        ? "#d88a00"
        : status === "COMPLETED"
          ? "#0366d6"
          : status === "CANCELED"
            ? "#999"
            : "#b33636"; // NO_SHOW or anything else
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        color: "white",
        background: color,
        fontSize: 12,
      }}
    >
      {status.replaceAll("_", " ")} {/* nicer label */}
    </span>
  );
}

function Th({
  sp,
  label,
  sortKey,
  sort,
  order,
}: {
  sp: URLSearchParams;
  label: string;
  sortKey: string;
  sort: string;
  order: "asc" | "desc";
}) {
  const isActive = sort === sortKey;
  const nextOrder = isActive && order === "asc" ? "desc" : "asc";
  const href = buildHref(sp, { sort: sortKey, order: nextOrder, page: "1" });

  return (
    <th style={th}>
      <Link
        href={href}
        style={{
          color: "#333",
          textDecoration: "none",
          fontWeight: isActive ? 600 : 400,
        }}
      >
        {label}{" "}
        <span style={{ color: "#777", fontSize: 12 }}>
          {isActive ? (order === "asc" ? "▲" : "▼") : ""}
        </span>
      </Link>
    </th>
  );
}

/* simple shared styles */
const input: React.CSSProperties = {
  width: "100%",
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
  minWidth: 140,
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
