/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { db } from "@/lib/db";
import { requireGroomer } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import RowActions from "@/components/groomerPage/RowActions/RowActions";
import { addDays, endOfDay, startOfDay } from "date-fns";
import type { BookingStatus } from "@prisma/client";

type SearchParamsPromise = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export const dynamic = "force-dynamic";

/* timezone formatters (match other pages) */
const TZ = process.env.SALON_TZ ?? "America/Phoenix";
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

/* ──────────────────────────────────────────────────────────
   Server Action: set booking status
────────────────────────────────────────────────────────── */
export async function setBookingStatus(formData: FormData) {
  "use server";
  const user = await requireGroomer();

  const id = formData.get("id") as string;
  const status = formData.get("status") as BookingStatus;

  // Safety: only allow changing your own bookings
  const booking = await db.booking.findUnique({
    where: { id },
    select: { groomerId: true },
  });
  if (!booking || booking.groomerId !== user.id) {
    throw new Error("Unauthorized");
  }

  await db.booking.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/groomer/my-bookings");
}

/* ──────────────────────────────────────────────────────────
   Page
────────────────────────────────────────────────────────── */
export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  const user = await requireGroomer();

  // Next 15: searchParams is async
  const sp = await searchParams;
  const filterParam = Array.isArray(sp?.filter) ? sp?.filter[0] : sp?.filter;
  type Filter =
    | "upcoming"
    | "pending"
    | "confirmed"
    | "completed"
    | "canceled"
    | "no_show"
    | "all"
    | undefined;
  const filter = filterParam as Filter;

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekEnd = endOfDay(addDays(todayStart, 7));

  // Build where clause based on filter
  const baseWhere = { groomerId: user.id };
  let where: any = { ...baseWhere };

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

  const bookings = await db.booking.findMany({
    where,
    include: {
      service: { select: { name: true, durationMin: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { start: "asc" },
    take: 50,
  });

  const pendingCount = await db.booking.count({
    where: {
      groomerId: user.id,
      status: "PENDING",
      start: { gte: todayStart, lte: weekEnd },
    },
  });

  return (
    <section style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>My Bookings</h1>

      {/* Filters */}
      <nav
        style={{
          marginBottom: "1rem",
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <FilterLink
          href='/groomer/my-bookings'
          current={!filter || filter === "upcoming"}
        >
          Upcoming
        </FilterLink>
        <FilterLink
          href='/groomer/my-bookings?filter=pending'
          current={filter === "pending"}
        >
          Pending {pendingCount > 0 && <Badge>{pendingCount}</Badge>}
        </FilterLink>
        <FilterLink
          href='/groomer/my-bookings?filter=confirmed'
          current={filter === "confirmed"}
        >
          Confirmed
        </FilterLink>
        <FilterLink
          href='/groomer/my-bookings?filter=completed'
          current={filter === "completed"}
        >
          Completed
        </FilterLink>
        <FilterLink
          href='/groomer/my-bookings?filter=canceled'
          current={filter === "canceled"}
        >
          Canceled
        </FilterLink>
        <FilterLink
          href='/groomer/my-bookings?filter=no_show'
          current={filter === "no_show"}
        >
          No-Show
        </FilterLink>
        <FilterLink
          href='/groomer/my-bookings?filter=all'
          current={filter === "all"}
        >
          All
        </FilterLink>
      </nav>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Date</th>
              <th style={th}>Time</th>
              <th style={th}>Booked</th>
              <th style={th}>Service</th>
              <th style={th}>Customer</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 12, textAlign: "center" }}>
                  No bookings for this view.
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const start = new Date(b.start);
                const created = new Date(b.createdAt);

                const dateStr = dateFmt.format(start);
                const timeStr = timeFmt.format(start);
                const bookedDate = dateFmt.format(created);
                const bookedTime = timeFmt.format(created);

                const canConfirm = b.status === "PENDING";
                const canCancel =
                  b.status === "PENDING" || b.status === "CONFIRMED";
                const canComplete =
                  b.status === "CONFIRMED" && start <= new Date();
                const canNoShow =
                  b.status === "CONFIRMED" && start <= new Date();

                return (
                  <tr key={b.id}>
                    <td style={td}>{dateStr}</td>
                    <td style={td}>{timeStr}</td>
                    <td style={td}>
                      {bookedDate}{" "}
                      <small style={{ color: "#666" }}>{bookedTime}</small>
                    </td>
                    <td style={td}>
                      {b.service.name} <small>({b.service.durationMin}m)</small>
                    </td>
                    <td style={td}>
                      {b.user.name ?? "—"}
                      <br />
                      <small>{b.user.email}</small>
                    </td>
                    <td style={td}>
                      <StatusBadge status={b.status as BookingStatus} />
                    </td>
                    <td style={td}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        {/* NEW: View button linking to details page */}
                        <Link
                          href={`/groomer/my-bookings/${b.id}`}
                          style={outlineBtnSmall}
                          title='View booking details'
                        >
                          View
                        </Link>

                        {/* Existing row actions (confirm/cancel/complete/no-show) */}
                        <RowActions
                          bookingId={b.id}
                          onSetStatus={setBookingStatus}
                          canConfirm={canConfirm}
                          canCancel={canCancel}
                          canComplete={canComplete}
                          canNoShow={canNoShow}
                        />
                      </div>
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

/* ───────────── UI helpers ───────────── */

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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        marginLeft: 6,
        padding: "0 6px",
        borderRadius: 999,
        background: "#e33",
        color: "white",
        fontSize: 12,
      }}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
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
      {status.replace("_", " ")}
    </span>
  );
}

/* simple table styles */
const th: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 8,
  background: "#fafafa",
};
const td: React.CSSProperties = { border: "1px solid #ddd", padding: 8 };

/* NEW: compact outline button for inline table actions */
const outlineBtnSmall: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  background: "white",
  color: "#333",
  border: "1px solid #ddd",
  cursor: "pointer",
  textDecoration: "none",
  fontSize: 13,
};
