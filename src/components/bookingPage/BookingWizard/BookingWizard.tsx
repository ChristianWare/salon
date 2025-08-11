/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

/* ─────────────────────────────────────────────────────────
   Types
────────────────────────────────────────────────────────── */
type Service = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  active: boolean;
};
type GroomerLite = { id: string; name: string };
type Slot = { iso: string; label: string; time24: string };
type GroomerCalendar = { workDays: number[]; blackoutISO: string[] };

/* ─────────────────────────────────────────────────────────
   Date helpers
────────────────────────────────────────────────────────── */
function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ─────────────────────────────────────────────────────────
   Calendar Popover (styled, with disabled dates)
────────────────────────────────────────────────────────── */
function CalendarPopover({
  value,
  min,
  isDateEnabled,
  onChange,
}: {
  value?: string; // YYYY-MM-DD
  min?: string; // YYYY-MM-DD
  isDateEnabled?: (d: Date) => boolean; // return true if selectable
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  const today = useMemo(() => new Date(), []);
  const minDate = useMemo(
    () => (min ? new Date(min + "T00:00:00") : undefined),
    [min]
  );
  const selectedDate = useMemo(
    () => (value ? new Date(value + "T00:00:00") : undefined),
    [value]
  );
  const [month, setMonth] = useState<Date>(startOfMonth(selectedDate ?? today));

  // close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!popRef.current || !anchorRef.current) return;
      if (
        popRef.current.contains(e.target as Node) ||
        anchorRef.current.contains(e.target as Node)
      )
        return;
      setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const daysInMonth = endOfMonth(month).getDate();
  const firstDayIndex = new Date(
    month.getFullYear(),
    month.getMonth(),
    1
  ).getDay();

  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = Array(firstDayIndex).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(new Date(month.getFullYear(), month.getMonth(), d));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const headerLabel = month.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  const triggerLabel = selectedDate
    ? selectedDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Select date";

  const handleSelect = (d: Date) => {
    const tooEarly = minDate && d < minDate;
    const blockedByRule = isDateEnabled ? !isDateEnabled(d) : false;
    if (tooEarly || blockedByRule) return;
    onChange(ymd(d));
    setOpen(false);
  };

  return (
    <div ref={anchorRef} style={{ position: "relative" }}>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        aria-haspopup='dialog'
        aria-expanded={open}
        style={{
          ...input,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span>{triggerLabel}</span>
        <span style={{ fontSize: 12, color: "#666" }}>▼</span>
      </button>

      {open && (
        <div
          ref={popRef}
          role='dialog'
          aria-label='Choose a date'
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 50,
            ...cardSoft,
            width: 292,
            boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <button
              type='button'
              onClick={() => setMonth((m) => addMonths(m, -1))}
              style={navBtn}
              aria-label='Previous month'
            >
              ‹
            </button>
            <div style={{ fontWeight: 600 }}>{headerLabel}</div>
            <button
              type='button'
              onClick={() => setMonth((m) => addMonths(m, 1))}
              style={navBtn}
              aria-label='Next month'
            >
              ›
            </button>
          </div>

          {/* Weekday header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
              marginBottom: 6,
              fontSize: 11,
              color: "#666",
              textAlign: "center",
            }}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          {/* Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
            }}
          >
            {weeks.map((row, i) =>
              row.map((cell, j) => {
                if (!cell)
                  return <div key={`${i}-${j}`} style={{ height: 40 }} />;

                const tooEarly = minDate && cell < minDate;
                const blockedByRule = isDateEnabled
                  ? !isDateEnabled(cell)
                  : false;

                const disabled = tooEarly || blockedByRule;
                const selected = selectedDate && isSameDay(selectedDate, cell);
                const isToday = isSameDay(new Date(), cell);

                const style: React.CSSProperties = {
                  height: 40,
                  borderRadius: 8,
                  fontSize: 14,
                  border: "1px solid #eee",
                  background: "white",
                  cursor: disabled ? "not-allowed" : "pointer",
                  color: disabled ? "#aaa" : undefined,
                };

                if (disabled) {
                  style.background = "#fafafa";
                  style.borderColor = "#f0f0f0";
                } else if (selected) {
                  style.background = "#111";
                  style.color = "white";
                  style.borderColor = "#111";
                  style.fontWeight = 600;
                } else if (isToday) {
                  style.borderColor = "#0366d6";
                }

                return (
                  <button
                    key={cell.toISOString()}
                    type='button'
                    onClick={() => handleSelect(cell)}
                    disabled={disabled}
                    style={style}
                    aria-current={selected ? "date" : undefined}
                  >
                    {cell.getDate()}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button
              type='button'
              onClick={() => setMonth(startOfMonth(new Date()))}
              style={outlineBtn}
            >
              Today
            </button>
            <span style={{ flex: 1 }} />
            <button
              type='button'
              onClick={() => setOpen(false)}
              style={outlineBtn}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Booking Wizard (single file)
────────────────────────────────────────────────────────── */
export default function BookingWizard({
  services,
  groomers,
  calendars,
}: {
  services: Service[];
  groomers: GroomerLite[];
  calendars: Record<string, GroomerCalendar>;
}) {
  const [serviceId, setServiceId] = useState("");
  const [groomerId, setGroomerId] = useState("");
  const [date, setDate] = useState<string>(""); // YYYY-MM-DD
  const [slots, setSlots] = useState<Slot[]>([]);
  const [pending, start] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const todayISO = useMemo(() => ymd(new Date()), []);

  const selectedService = services.find((s) => s.id === serviceId);
  const price = selectedService
    ? (selectedService.priceCents / 100).toFixed(2)
    : null;
  const duration = selectedService?.durationMin ?? null;

  const selectedCal = useMemo(
    () => calendars[groomerId],
    [calendars, groomerId]
  );

  const isDateEnabled = useMemo(() => {
    if (!selectedCal) return (d: Date) => true; // until groomer chosen
    const workSet = new Set(selectedCal.workDays); // 0..6
    const blackoutSet = new Set(selectedCal.blackoutISO); // "YYYY-MM-DD"
    return (d: Date) => {
      const dow = d.getDay();
      if (!workSet.has(dow)) return false;
      return !blackoutSet.has(ymd(d));
    };
  }, [selectedCal]);

  // If current selected date becomes invalid after switching groomer, clear it
  useEffect(() => {
    if (!date) return;
    const d = new Date(date + "T00:00:00");
    if (!Number.isNaN(d.valueOf()) && !isDateEnabled(d)) {
      setDate("");
      setSlots([]);
      setMessage("");
      setSuccess("");
    }
  }, [isDateEnabled, date]);

  const canFetch = useMemo(
    () => Boolean(serviceId && groomerId && date),
    [serviceId, groomerId, date]
  );

  // fetch slots when all inputs chosen
  useEffect(() => {
    setSlots([]);
    setMessage("");
    setSuccess("");
    if (!canFetch) return;

    let canceled = false;
    start(async () => {
      try {
        const params = new URLSearchParams({
          serviceId,
          groomerId,
          date,
        }).toString();
        const res = await fetch(`/api/availability?${params}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as Slot[] | { error: string };
        if (!canceled) {
          if (Array.isArray(data)) setSlots(data);
          else setMessage(data.error || "Failed to load availability");
        }
      } catch {
        if (!canceled) setMessage("Failed to load availability");
      }
    });

    return () => {
      canceled = true;
    };
  }, [canFetch, serviceId, groomerId, date]);

  async function book(slotIso: string) {
    setSubmitting(true);
    setMessage("");
    setSuccess("");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, groomerId, start: slotIso }),
      });

      if (res.status === 409) {
        setMessage("Whoops — that slot was just taken. Pick another one.");
      } else if (!res.ok) {
        const j = await res.json().catch(() => ({}) as any);
        setMessage(j.error || "Booking failed");
      } else {
        setSuccess("Booked! Check your email for confirmation.");
      }
    } catch {
      setMessage("Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* selectors */}
      <div style={{ display: "grid", gap: 12, maxWidth: 620 }}>
        <div>
          <label style={label}>Service</label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            style={select}
          >
            <option value=''>Select service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.durationMin ? `• ${s.durationMin}m` : ""} • $
                {(s.priceCents / 100).toFixed(2)}
              </option>
            ))}
          </select>
          {selectedService && (
            <div style={helpText}>
              Duration: {duration} min · Price: ${price}
            </div>
          )}
        </div>

        <div>
          <label style={label}>Groomer</label>
          <select
            value={groomerId}
            onChange={(e) => setGroomerId(e.target.value)}
            style={select}
          >
            <option value=''>Select groomer</option>
            {groomers.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          {groomerId && selectedCal && (
            <div style={helpText}>
              Select a date on:{" "}
              {selectedCal.workDays
                .slice()
                .sort((a, b) => a - b)
                .map(
                  (d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]
                )
                .join(", ")}
              {selectedCal.blackoutISO.length > 0 &&
                " (some dates unavailable)"}
            </div>
          )}
        </div>

        <div>
          <label style={label}>Date</label>
          <CalendarPopover
            value={date}
            min={todayISO}
            isDateEnabled={isDateEnabled}
            onChange={setDate}
          />
        </div>
      </div>

      {/* feedback */}
      <div style={{ marginTop: 10 }}>
        {pending && <p style={{ color: "#666" }}>Loading available times…</p>}
        {!pending && canFetch && slots.length === 0 && !message && (
          <p style={{ color: "#666" }}>No available times for that date.</p>
        )}
        {message && <p style={{ color: "#b33636" }}>{message}</p>}
        {success && (
          <div
            style={{
              ...cardSoft,
              color: "#065f46",
              borderColor: "#a7f3d0",
              background: "#ecfdf5",
            }}
          >
            <div style={{ marginBottom: 6 }}>{success}</div>
            <a href='/dashboard/my-bookings' style={outlineBtn}>
              View My Bookings
            </a>
          </div>
        )}
      </div>

      {/* slots */}
      {slots.length > 0 && (
        <>
          <h3 style={{ marginTop: 14, marginBottom: 8 }}>Available Times</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {slots.map((s) => (
              <button
                key={s.iso}
                onClick={() => book(s.iso)}
                disabled={submitting}
                style={{ ...slotBtn, opacity: submitting ? 0.6 : 1 }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div style={{ ...helpText, marginTop: 8 }}>
            Times shown are in your local timezone.
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Inline styling tokens (consistent with your app)
────────────────────────────────────────────────────────── */
const label: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#666",
  marginBottom: 4,
};
const helpText: React.CSSProperties = {
  fontSize: 12,
  color: "#666",
  marginTop: 6,
};
const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
};
const select: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
};
const slotBtn: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
  cursor: "pointer",
};
const cardSoft: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 8,
  padding: 12,
  background: "white",
};
const outlineBtn: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  background: "white",
  color: "#333",
  border: "1px solid #ddd",
  cursor: "pointer",
  textDecoration: "none",
};
const navBtn: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: 6,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
};
