/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/bookingPage/BookingWizard/BookingWizard.tsx
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

  const canFetch = useMemo(
    () => serviceId && groomerId && date,
    [serviceId, groomerId, date]
  );

  // fetch slots when all inputs chosen
  useEffect(() => {
    setSlots([]);
    setMessage("");
    if (!canFetch) return;

    let canceled = false;
    (async () => {
      start(async () => {
        try {
          const params = new URLSearchParams({
            serviceId,
            groomerId,
            date, // YYYY-MM-DD
          }).toString();
          const res = await fetch(`/api/availability?${params}`, {
            cache: "no-store",
          });
          const data = (await res.json()) as Slot[] | { error: string };
          if (!canceled) {
            if (Array.isArray(data)) setSlots(data);
            else setMessage(data.error || "Failed to load availability");
          }
        } catch (e) {
          if (!canceled) setMessage("Failed to load availability");
        }
      });
    })();

    return () => {
      canceled = true;
    };
  }, [canFetch, serviceId, groomerId, date, start]);

  async function book(slotIso: string) {
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          groomerId,
          start: slotIso,
        }),
      });
      if (res.status === 409) {
        setMessage("Whoops — that slot was just taken. Pick another one.");
      } else if (!res.ok) {
        const j = await res.json().catch(() => ({}) as any);
        setMessage(j.error || "Booking failed");
      } else {
        setMessage("Booked! Check your email for confirmation.");
        // Optionally redirect to “My bookings” page
        // router.push('/dashboard/bookings')
      }
    } catch {
      setMessage("Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      <div style={{ display: "grid", gap: "1rem", maxWidth: 560 }}>
        <div>
          <label>
            <strong>Service</strong>
            <br />
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              <option value=''>Select service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label>
            <strong>Groomer</strong>
            <br />
            <select
              value={groomerId}
              onChange={(e) => setGroomerId(e.target.value)}
            >
              <option value=''>Select groomer</option>
              {groomers.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label>
            <strong>Date</strong>
            <br />
            <input
              type='date'
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </label>
        </div>
      </div>

      {/* Slots */}
      <div style={{ marginTop: "1rem" }}>
        {pending && <p>Loading available times…</p>}
        {!pending && canFetch && slots.length === 0 && !message && (
          <p>No available times for that date.</p>
        )}
        {message && <p style={{ color: "#b33636" }}>{message}</p>}

        {slots.length > 0 && (
          <>
            <h3>Available Times</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {slots.map((s) => (
                <button
                  key={s.iso}
                  onClick={() => book(s.iso)}
                  disabled={submitting}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: 6,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
