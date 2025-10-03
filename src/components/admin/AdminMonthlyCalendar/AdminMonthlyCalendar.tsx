"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Modal from "@/components/shared/Modal/Modal";
import styles from "./AdminMonthlyCalendar.module.css";

const TZ = process.env.NEXT_PUBLIC_SALON_TZ ?? "America/Phoenix";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type ApiBooking = {
  id: string;
  start: string;
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
  const day = d.getDay();
  const diff = day === 0 ? 0 : day;
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
function ymd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function adminDayHref(date: Date) {
  const d = ymd(date);
  const qs = new URLSearchParams({
    q: "",
    status: "",
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
function fmtTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AdminMonthlyCalendar() {
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [filters, setFilters] = useState<Filters>({
    includeCanceled: false,
    statuses: new Set(["PENDING", "CONFIRMED", "COMPLETED"]),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [modalItems, setModalItems] = useState<ApiBooking[]>([]);

  const monthKey = `${monthDate.getFullYear()}-${String(
    monthDate.getMonth() + 1
  ).padStart(2, "0")}`;

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

  const days = useMemo(() => {
    const first = startOfMonth(monthDate);
    const last = endOfMonth(monthDate);
    const gridStart = startOfWeek(first);
    const grid: Date[] = [];
    for (let i = 0; i < 42; i++) grid.push(addDays(gridStart, i));
    const filtered = bookings.filter((b) => {
      if (filters.includeCanceled) return true;
      return filters.statuses.has(b.status);
    });
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
    const val = e.target.value;
    if (!val) return;
    const [y, m] = val.split("-").map(Number);
    setMonthDate(new Date(y, m - 1, 1));
  }

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = e.changedTouches[0].clientX;
  }
  function onTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    touchEndX.current = e.changedTouches[0].clientX;
  }
  function onTouchEnd() {
    if (touchStartX.current == null || touchEndX.current == null) return;
    const delta = touchEndX.current - touchStartX.current;
    const threshold = 40;
    if (delta <= -threshold) goNext();
    if (delta >= threshold) goPrev();
    touchStartX.current = null;
    touchEndX.current = null;
  }

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "long",
    year: "numeric",
  }).format(monthDate);

  function openModalForDay(date: Date, items: ApiBooking[]) {
    setModalDate(date);
    setModalItems(items);
    setIsModalOpen(true);
  }

  const todayYMD = ymd(new Date());

  return (
    <div
      className={styles.wrap}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button type='button' className={styles.btn} onClick={goPrev}>
            ← Prev
          </button>
          <button
            type='button'
            className={`${styles.btn} ${styles.primary}`}
            onClick={goToday}
          >
            Today
          </button>
          <button type='button' className={styles.btn} onClick={goNext}>
            Next →
          </button>
          <div className={styles.monthLabel}>{monthLabel}</div>
        </div>

        <div className={styles.controls}>
          <input
            type='month'
            value={`${monthDate.getFullYear()}-${String(
              monthDate.getMonth() + 1
            ).padStart(2, "0")}`}
            onChange={onPickMonth}
            className={`${styles.btn} ${styles.monthPicker}`}
            aria-label='Jump to month'
          />
          <label className={styles.checkboxLabel}>
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

      <div className={styles.viewport}>
        <div className={styles.inner}>
          <div className={styles.gridHead}>
            {WEEKDAYS.map((d) => (
              <div key={d} className={styles.dowCell}>
                {d}
              </div>
            ))}
          </div>

          {loading ? (
            <div className={styles.loading}>Loading…</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : (
            <div className={styles.gridDays}>
              {days.grid.map((d) => {
                const key = ymd(d);
                const list = days.map.get(key) ?? [];
                const isOtherMonth = d.getMonth() !== monthDate.getMonth();
                const isToday = key === todayYMD;
                const isPast = key < todayYMD;
                const label = `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;

                return (
                  <div
                    key={key}
                    className={`${styles.dayCell} ${
                      isOtherMonth ? styles.dayCellOther : ""
                    } ${isToday ? styles.today : ""} ${
                      isPast ? styles.pastDay : ""
                    }`}
                  >
                    <div className={styles.dayTop}>
                      <span className={styles.dayLabel}>{label}</span>
                      <span className={styles.dayNumDesk}>{d.getDate()}</span>
                    </div>

                    {list.length === 0 ? (
                      <div className={styles.empty}>—</div>
                    ) : (
                      <>
                        <div className={styles.chipRow}>
                          <Link
                            href={adminDayHref(d)}
                            className={styles.countChip}
                            title={`View ${list.length} appointment${
                              list.length === 1 ? "" : "s"
                            } on ${d.toDateString()}`}
                          >
                            {list.length} appointment
                            {list.length === 1 ? "" : "s"}
                          </Link>
                          <button
                            type='button'
                            className={styles.countChipMobile}
                            onClick={() => openModalForDay(d, list)}
                          >
                            {list.length} appointment
                            {list.length === 1 ? "" : "s"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <div className={styles.modalTitle}>
              {modalDate
                ? `${WEEKDAYS[modalDate.getDay()]}, ${
                    MONTHS[modalDate.getMonth()]
                  } ${modalDate.getDate()}`
                : ""}
            </div>
          </div>
          <div className={styles.modalBody}>
            {modalItems.length === 0 ? (
              <div className={styles.modalEmpty}>No appointments</div>
            ) : (
              <ul className={styles.eventList}>
                {modalItems.map((b) => {
                  const t = new Date(b.start);
                  return (
                    <li key={b.id} className={styles.eventItem}>
                      <div className={styles.eventTime}>{fmtTime(t)}</div>
                      <div className={styles.eventMain}>
                        <div className={styles.eventTitle}>
                          {b.serviceName ?? "Service"}
                        </div>
                        <div className={styles.eventMeta}>
                          {b.userName ?? "—"} · {b.groomerName ?? "—"}
                        </div>
                      </div>
                      <span
                        className={`${styles.badge} ${
                          b.status === "CONFIRMED"
                            ? styles.badge_confirmed
                            : b.status === "PENDING"
                              ? styles.badge_pending
                              : b.status === "COMPLETED"
                                ? styles.badge_completed
                                : b.status === "CANCELED"
                                  ? styles.badge_canceled
                                  : styles.badge_noshow
                        }`}
                      >
                        {b.status.replace("_", " ")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className={styles.modalFooter}>
            <button
              type='button'
              className={`${styles.btn} ${styles.primary}`}
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
