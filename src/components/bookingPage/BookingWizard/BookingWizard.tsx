"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import FalseButton from "@/components/shared/FalseButton/FalseButton";

type Service = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
};
type Groomer = { id: string; name: string };

export default function BookingWizard({
  services,
  groomers,
}: {
  services: Service[];
  groomers: Groomer[];
}) {
  const router = useRouter();

  // step state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // form state
  const [serviceId, setServiceId] = useState("");
  const [groomerId, setGroomerId] = useState("");
  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [slot, setSlot] = useState(""); // ISO string

  // slots fetched from API
  const [slots, setSlots] = useState<string[]>([]);
  const loadSlots = async () => {
    if (!serviceId || !groomerId || !date) return;
    const q = new URLSearchParams({ serviceId, groomerId, date }).toString();
    const res = await fetch("/api/availability?" + q);
    setSlots(await res.json());
  };

  // server action wrapped in fetch (simplest)
  const createBooking = async () => {
    const res = await fetch("/api/book", {
      method: "POST",
      body: JSON.stringify({ serviceId, groomerId, start: slot }),
    });
    if (res.ok) {
      router.push("/dashboard"); // or success page
    } else {
      alert("Booking failed.");
    }
  };

  /*──────────────────────────  UI  ─────────────────────────*/
  return (
    <div style={{ maxWidth: 600 }}>
      {step === 1 && (
        <>
          <h2>Select Service</h2>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value=''>Choose…</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — ${(s.priceCents / 100).toFixed(2)}
              </option>
            ))}
          </select>
          <br />
          <button disabled={!serviceId} onClick={() => setStep(2)}>
            Next
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h2>Choose Groomer & Date</h2>
          <select
            value={groomerId}
            onChange={(e) => setGroomerId(e.target.value)}
          >
            <option value=''>Any Groomer</option>
            {groomers.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <br />
          <input
            type='date'
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <br />
          {/* <button disabled={!date || !groomerId} onClick={() => loadSlots()}>
            Show Slots
          </button> */}
          <FalseButton
            disabled={!date || !groomerId}
            onClick={() => loadSlots()}
            text='Show Slots'
            btnType='orange'
          />
          {slots.length > 0 && (
            <ul style={{ marginTop: 12 }}>
              {slots.map((iso) => (
                <li key={iso}>
                  <label>
                    <input
                      type='radio'
                      name='slot'
                      value={iso}
                      checked={slot === iso}
                      onChange={() => setSlot(iso)}
                    />
                    {new Date(iso).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </label>
                </li>
              ))}
            </ul>
          )}
          <FalseButton
            disabled={!slot}
            onClick={() => setStep(3)}
            text='Next'
            btnType='noBackgroundBlackText'
            arrow
          />
        </>
      )}

      {step === 3 && (
        <>
          <h2>Confirm</h2>
          <p>
            Service: {services.find((s) => s.id === serviceId)?.name}
            <br />
            Groomer: {groomers.find((g) => g.id === groomerId)?.name}
            <br />
            When:&nbsp;
            {new Date(slot).toLocaleString()}
          </p>
          <button onClick={createBooking}>Confirm Booking</button>
        </>
      )}
    </div>
  );
}
