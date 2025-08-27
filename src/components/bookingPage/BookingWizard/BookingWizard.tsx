/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import LayoutWrapper from "@/components/shared/LayoutWrapper";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
// ⬇️ Update this path if your CheckoutStep lives elsewhere
import CheckoutStep from "@/components/bookingPage/Checkout/CheckoutStep";

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

type Slot = {
  iso: string;
  label: string;
  time24: string;
  /** present when groomerId=ANY was used to fetch availability */
  groomerId?: string;
  groomerName?: string;
};

type GroomerCalendar = { workDays: number[]; blackoutISO: string[] };

type Checkout = {
  bookingId: string;
  clientSecret: string;
  amountDueCents: number;
  slotIso: string;
  totals?: {
    depositCents: number;
    taxCents: number;
    feeCents?: number;
    discountCents?: number;
  };
} | null;


/* ─────────────────────────────────────────────────────────
   Constants
────────────────────────────────────────────────────────── */
const ANY_ID = "ANY";

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
  const [message, setMessage] = useState<string>("");

  // When a slot is chosen, we launch the checkout step:
  const [checkoutSlot, setCheckoutSlot] = useState<{
    iso: string;
    groomerId: string;
    groomerName?: string;
  } | null>(null);

  // ⬇️ New: holds the prepared payment info
  const [checkout, setCheckout] = useState<Checkout>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string>("");

  const todayISO = useMemo(() => ymd(new Date()), []);

  const selectedService = services.find((s) => s.id === serviceId);
  const price = selectedService
    ? (selectedService.priceCents / 100).toFixed(2)
    : null;
  const duration = selectedService?.durationMin ?? null;

  // For helper text when a specific groomer is chosen
  const selectedCal = useMemo(
    () =>
      groomerId && groomerId !== ANY_ID ? calendars[groomerId] : undefined,
    [calendars, groomerId]
  );

  // Date enable rules:
  // - Specific groomer: only that groomer's work days, minus blackouts
  // - ANY: enable if at least one groomer works that DOW and isn't blacked out that date
  const isDateEnabled = useMemo(() => {
    if (groomerId && groomerId !== ANY_ID) {
      const cal = calendars[groomerId];
      if (!cal) return (d: Date) => true;
      const workSet = new Set(cal.workDays);
      const blackoutSet = new Set(cal.blackoutISO);
      return (d: Date) => workSet.has(d.getDay()) && !blackoutSet.has(ymd(d));
    }

    // ANY groomer case
    const entries = Object.entries(calendars);
    if (entries.length === 0) return (_d: Date) => false;
    return (d: Date) => {
      const day = d.getDay();
      const iso = ymd(d);
      for (const [, cal] of entries) {
        if (cal.workDays.includes(day) && !cal.blackoutISO.includes(iso)) {
          return true;
        }
      }
      return false;
    };
  }, [calendars, groomerId]);

  // If current selected date becomes invalid after switching groomer, clear it
  useEffect(() => {
    if (!date) return;
    const d = new Date(date + "T00:00:00");
    if (!Number.isNaN(d.valueOf()) && !isDateEnabled(d)) {
      setDate("");
      setSlots([]);
      setMessage("");
      setCheckoutSlot(null);
      setCheckout(null);
    }
  }, [isDateEnabled, date]);

  const canFetch = useMemo(
    () => Boolean(serviceId && groomerId && date && !checkoutSlot),
    [serviceId, groomerId, date, checkoutSlot]
  );

  // fetch slots when all inputs chosen
  useEffect(() => {
    setSlots([]);
    setMessage("");
    if (!canFetch) return;

    let canceled = false;
    start(async () => {
      try {
        const params = new URLSearchParams({
          serviceId,
          groomerId, // may be a specific ID or "ANY"
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

  // safer time formatter
  function displayTime(slot: Slot) {
    const hasHHMM =
      typeof slot.time24 === "string" && /^\d{2}:\d{2}$/.test(slot.time24);
    if (hasHHMM) {
      const [h, m] = slot.time24!.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = ((h + 11) % 12) + 1;
      return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
    }
    if (slot.iso) {
      return new Date(slot.iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "—";
  }

  // When the user chooses a slot, launch checkout
  function chooseSlot(s: Slot, fallbackGroomerId: string) {
    if (!s.iso) return;
    const gid = s.groomerId ?? fallbackGroomerId;
    // Reset checkout state before preparing a new one
    setCheckout(null);
    setCheckoutError("");
    setCheckoutLoading(true);
    setCheckoutSlot({ iso: s.iso, groomerId: gid, groomerName: s.groomerName });
  }

  // ⬇️ Prepare payment when we have a checkoutSlot
  useEffect(() => {
    let aborted = false;

    async function prepare() {
      if (!checkoutSlot || !selectedService) return;
      try {
        const res = await fetch("/api/book/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId: selectedService.id,
            // The definitive groomer for this slot (specific or assigned)
            groomerId: checkoutSlot.groomerId,
            slotIso: checkoutSlot.iso,
          }),
        });

        const data = (await res.json()) as
          | {
              bookingId: string;
              clientSecret: string;
              amountDueCents: number;
              slotIso: string;
            }
          | { error?: string };

        if (aborted) return;

        if (!res.ok || !("bookingId" in data)) {
          setCheckoutError(
            (data as any)?.error || "Could not initialize payment."
          );
          setCheckout(null);
        } else {
          setCheckout({
            bookingId: data.bookingId,
            clientSecret: data.clientSecret,
            amountDueCents: data.amountDueCents,
            slotIso: data.slotIso,
            totals: (data as any).totals,
          });
        }
      } catch (e: any) {
        if (!aborted) {
          setCheckoutError(e?.message || "Could not initialize payment.");
          setCheckout(null);
        }
      } finally {
        if (!aborted) setCheckoutLoading(false);
      }
    }

    // Only prepare when a slot is chosen
    if (checkoutSlot) {
      prepare();
    } else {
      // cleared
      setCheckout(null);
      setCheckoutLoading(false);
      setCheckoutError("");
    }

    return () => {
      aborted = true;
    };
  }, [checkoutSlot, selectedService]);

  const selectedGroomerLabel =
    checkoutSlot?.groomerName ||
    (groomerId === ANY_ID
      ? "Any available groomer"
      : groomers.find((g) => g.id === groomerId)?.name || "Groomer");

  return (
    <LayoutWrapper>
      {/* selectors */}
      {!checkoutSlot && (
        <div style={{ display: "grid", gap: 12, maxWidth: 620 }}>
          <div>
            <label style={label}>Service</label>
            <select
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setCheckoutSlot(null);
                setCheckout(null);
              }}
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
              onChange={(e) => {
                setGroomerId(e.target.value);
                setCheckoutSlot(null);
                setCheckout(null);
              }}
              style={select}
            >
              <option value=''>Select groomer</option>
              <option value={ANY_ID}>Any available groomer</option>
              {groomers.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            {/* Helper text */}
            {groomerId && groomerId !== ANY_ID && selectedCal && (
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
            {groomerId === ANY_ID && (
              <div style={helpText}>
                We’ll match you to the best available pro for your chosen time.
              </div>
            )}
          </div>

          <div>
            <label style={label}>Date</label>
            <CalendarPopover
              value={date}
              min={todayISO}
              isDateEnabled={isDateEnabled}
              onChange={(d) => {
                setDate(d);
                setCheckoutSlot(null);
                setCheckout(null);
              }}
            />
          </div>
        </div>
      )}

      {/* feedback */}
      {!checkoutSlot && (
        <div style={{ marginTop: 10 }}>
          {pending && <p style={{ color: "#666" }}>Loading available times…</p>}
          {!pending &&
            serviceId &&
            groomerId &&
            date &&
            slots.length === 0 &&
            !message && (
              <p style={{ color: "#666" }}>No available times for that date.</p>
            )}
          {message && <p style={{ color: "#b33636" }}>{message}</p>}
        </div>
      )}

      {/* slots list OR checkout step */}
      {!checkoutSlot && slots.length > 0 && (
        <>
          <h3 style={{ marginTop: 14, marginBottom: 8 }}>Available Times</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {slots.map((s, idx) => (
              <button
                key={`${s.iso ?? idx}-${s.groomerId ?? ""}`}
                onClick={() => chooseSlot(s, groomerId)}
                disabled={!s.iso}
                style={{ ...slotBtn, opacity: s.iso ? 1 : 0.6 }}
                title={s.groomerName ? `With ${s.groomerName}` : undefined}
              >
                {displayTime(s)}
                {s.groomerName ? ` — ${s.groomerName}` : ""}
              </button>
            ))}
          </div>
          <div style={{ ...helpText, marginTop: 8 }}>
            Times shown are in your local timezone.
          </div>
        </>
      )}

      {/* Checkout step */}
      {checkoutSlot && (
        <div style={{ marginTop: 16, maxWidth: 640 }}>
          {checkoutLoading && (
            <div style={{ color: "#666" }}>Preparing secure payment…</div>
          )}

          {checkoutError && (
            <div style={{ color: "#b33636", marginBottom: 8 }}>
              {checkoutError}
            </div>
          )}

          {checkout && selectedService && (
            <>
              <CheckoutStep
                bookingId={checkout.bookingId}
                clientSecret={checkout.clientSecret}
                amountDueCents={checkout.amountDueCents}
                basePriceCents={selectedService.priceCents}
                depositCents={checkout.totals?.depositCents}
                taxCents={checkout.totals?.taxCents}
                feeCents={checkout.totals?.feeCents}
                discountCents={checkout.totals?.discountCents}
                serviceName={selectedService.name}
                durationMin={selectedService.durationMin}
                groomerName={selectedGroomerLabel}
                dateLabel={new Date(checkout.slotIso).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                timeLabel={new Date(checkout.slotIso).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                onDone={(_status) => {
                  window.location.href = "/dashboard/my-bookings";
                }}
              />

              <div style={{ marginTop: 8 }}>
                <button
                  type='button'
                  onClick={() => {
                    // Back to times
                    setCheckout(null);
                    setCheckoutSlot(null);
                    setCheckoutError("");
                    setCheckoutLoading(false);
                  }}
                  style={outlineBtn}
                >
                  Back
                </button>
              </div>
            </>
          )}

          {!checkoutLoading && !checkout && !checkoutError && (
            <div style={{ color: "#666" }}>
              Unable to initialize checkout for this time.
            </div>
          )}
        </div>
      )}
    </LayoutWrapper>
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
