/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

type Service = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  active: boolean;
};
type GroomerLite = { id: string; name: string };
type Slot = { iso: string; label: string; time24: string };

export default function BookingWizard({
  services,
  groomers,
}: {
  services: Service[];
  groomers: GroomerLite[];
}) {
  const [serviceId, setServiceId] = useState("");
  const [groomerId, setGroomerId] = useState("");
  const [date, setDate] = useState<string>(""); // YYYY-MM-DD
  const [slots, setSlots] = useState<Slot[]>([]);
  const [pending, start] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const canFetch = useMemo(
    () => Boolean(serviceId && groomerId && date),
    [serviceId, groomerId, date]
  );

  // local "today" (avoid UTC off-by-one)
  const todayISO = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

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
        // Optionally redirect:
        // router.push('/dashboard/my-bookings')
      }
    } catch {
      setMessage("Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedService = services.find((s) => s.id === serviceId);
  const price = selectedService
    ? (selectedService.priceCents / 100).toFixed(2)
    : null;
  const duration = selectedService?.durationMin ?? null;

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
                {s.name} {s.durationMin ? `• ${s.durationMin}m` : ""}{" "}
                {`• $${(s.priceCents / 100).toFixed(2)}`}
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
        </div>

        <div>
          <label style={label}>Date</label>
          <input
            type='date'
            value={date}
            min={todayISO}
            onChange={(e) => setDate(e.target.value)}
            style={input}
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

/* inline tokens — consistent with your app */
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
