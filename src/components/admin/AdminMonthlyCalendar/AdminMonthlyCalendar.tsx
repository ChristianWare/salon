"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// Keep styling consistent with your admin UI
const wrap: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 8,
  background: "white",
};
const header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: 12,
  borderBottom: "1px solid #eee",
};
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 0,
};
const dowCell: React.CSSProperties = {
  fontSize: 12,
  color: "#666",
  padding: 8,
  borderBottom: "1px solid #f3f3f3",
  background: "#fafafa",
};
const dayCell: React.CSSProperties = {
  borderRight: "1px solid #f5f5f5",
  borderBottom: "1px solid #f5f5f5",
  minHeight: 120,
  padding: 8,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};
const dayNum: React.CSSProperties = {
  marginLeft: "auto",
  fontSize: 12,
  color: "#666",
};
const controls: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};
const btn: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  background: "white",
  color: "#333",
  border: "1px solid #ddd",
  cursor: "pointer",
  textDecoration: "none",
};
const primaryBtn: React.CSSProperties = {
  ...btn,
  background: "#111",
  color: "white",
  borderColor: "#111",
};
// const legendWrap: React.CSSProperties = {
//   padding: 8,
//   borderTop: "1px solid #eee",
//   display: "flex",
//   gap: 12,
//   flexWrap: "wrap",
//   alignItems: "center",
//   fontSize: 12,
//   color: "#666",
// };
// const pillBase: React.CSSProperties = {
//   display: "inline-block",
//   padding: "2px 6px",
//   borderRadius: 999,
//   color: "white",
//   fontSize: 11,
//   textDecoration: "none",
//   lineHeight: 1.4,
// };

const countChip: React.CSSProperties = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: 999,
  background: "green",
  color: "#ffffff",
  border: "1px solid #111",
  textDecoration: "none",
  fontSize: 12,
  fontWeight: 600,
};

// status → color (match your StatusBadge palette)
// function statusColor(status: string) {
//   if (status === "CONFIRMED") return "#0a7";
//   if (status === "PENDING") return "#d88a00";
//   if (status === "COMPLETED") return "#0366d6";
//   if (status === "CANCELED") return "#999";
//   return "#b33636"; // NO_SHOW / else
// }

const TZ = process.env.NEXT_PUBLIC_SALON_TZ ?? "America/Phoenix";

type ApiBooking = {
  id: string;
  start: string; // ISO
  end: string | null;
  status: string;
  serviceName: string | null;
  userName: string | null;
  groomerName: string | null;
};

type Filters = {
  includeCanceled: boolean;
  statuses: Set<string>;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function startOfWeek(d: Date) {
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? 0 : day; // weeks start Sunday to match your tables
  const res = new Date(d);
  res.setDate(d.getDate() - diff);
  res.setHours(0, 0, 0, 0);
  return res;
}
function addDays(date: Date, n: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + n);
  return copy;
}
// function fmtHM(date: Date, locale = "en-US") {
//   return new Intl.DateTimeFormat(locale, {
//     timeZone: TZ,
//     hour: "2-digit",
//     minute: "2-digit",
//   }).format(date);
// }
function ymd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function adminDayHref(date: Date) {
  const d = ymd(date); // YYYY-MM-DD
  const qs = new URLSearchParams({
    q: "",
    status: "", // keep blank to show all; or pass your default
    groomerId: "",
    serviceId: "",
    from: d,
    to: d,
    sort: "start",
    order: "desc",
    page: "1",
    pageSize: "20",
  });
  return `/admin/bookings?${qs.toString()}`;
}

export default function AdminMonthlyCalendar() {
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [filters, setFilters] = useState<Filters>({
    includeCanceled: false,
    statuses: new Set(["PENDING", "CONFIRMED", "COMPLETED"]), // default visible
  });

  const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;

  // fetch month
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/bookings/month?month=${monthKey}`, { cache: "no-store" })
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("Failed to load"))
      )
      .then((json) => {
        if (!alive) return;
        setBookings(json?.bookings ?? []);
      })
      .catch((e) => alive && setError(e?.message || "Error"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [monthKey]);

  // group by day
  const days = useMemo(() => {
    // Build a 6x7 grid (Sun..Sat) covering the visible calendar
    const first = startOfMonth(monthDate);
    const last = endOfMonth(monthDate);
    const gridStart = startOfWeek(first);
    const grid: Date[] = [];
    for (let i = 0; i < 42; i++) grid.push(addDays(gridStart, i));

    // Filter bookings by status
    const filtered = bookings.filter((b) => {
      if (filters.includeCanceled) return true;
      return filters.statuses.has(b.status);
    });

    // Map date → list
    const map = new Map<string, ApiBooking[]>();
    for (const b of filtered) {
      const d = new Date(b.start);
      const key = ymd(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }

    return { grid, first, last, map };
  }, [monthDate, bookings, filters]);

  function goPrev() {
    setMonthDate((cur) => new Date(cur.getFullYear(), cur.getMonth() - 1, 1));
  }
  function goNext() {
    setMonthDate((cur) => new Date(cur.getFullYear(), cur.getMonth() + 1, 1));
  }
  function goToday() {
    setMonthDate(startOfMonth(new Date()));
  }
  function onPickMonth(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value; // "YYYY-MM"
    if (!val) return;
    const [y, m] = val.split("-").map(Number);
    setMonthDate(new Date(y, m - 1, 1));
  }

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "long",
    year: "numeric",
  }).format(monthDate);

  return (
    <div style={wrap}>
      {/* Header / controls */}
      <div style={header}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button type='button' style={btn} onClick={goPrev}>
            ← Prev
          </button>
          <button type='button' style={primaryBtn} onClick={goToday}>
            Today
          </button>
          <button type='button' style={btn} onClick={goNext}>
            Next →
          </button>
          <div style={{ fontWeight: 600 }}>{monthLabel}</div>
        </div>

        <div style={controls}>
          <input
            type='month'
            value={`${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`}
            onChange={onPickMonth}
            style={{ ...btn, cursor: "pointer" }}
            aria-label='Jump to month'
          />
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "#333",
            }}
          >
            <input
              type='checkbox'
              checked={filters.includeCanceled}
              onChange={(e) =>
                setFilters((f) => ({ ...f, includeCanceled: e.target.checked }))
              }
            />
            Include canceled / no-show
          </label>
        </div>
      </div>

      {/* Days of week */}
      <div style={grid}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} style={dowCell}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div style={{ padding: 16, color: "#666" }}>Loading…</div>
      ) : error ? (
        <div style={{ padding: 16, color: "#b33636" }}>{error}</div>
      ) : (
        <div style={grid}>
          {days.grid.map((d) => {
            const key = ymd(d);
            const isOtherMonth = d.getMonth() !== monthDate.getMonth();
            const list = days.map.get(key) ?? [];

            return (
              <div
                key={key}
                style={{
                  ...dayCell,
                  background: isOtherMonth ? "#fcfcfc" : "white",
                  opacity: isOtherMonth ? 0.8 : 1,
                }}
              >
                <div style={dayNum}>{d.getDate()}</div>

                {list.length === 0 ? (
                  <div style={{ flex: 1, color: "#aaa", fontSize: 12 }}>—</div>
                ) : (
                  <div>
                    <Link
                      href={adminDayHref(d)}
                      style={countChip}
                      title={`View ${list.length} appointment${list.length === 1 ? "" : "s"} on ${d.toDateString()}`}
                    >
                      {list.length} appointment{list.length === 1 ? "" : "s"}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {/* <div style={legendWrap}>
        <span>Legend:</span>
        {["PENDING", "CONFIRMED", "COMPLETED", "CANCELED", "NO_SHOW"].map(
          (s) => (
            <span
              key={s}
              style={{ ...pillBase, background: statusColor(s) }}
              title={s.replace("_", " ")}
            >
              {s.replace("_", " ")}
            </span>
          )
        )}
      </div> */}
    </div>
  );
}
