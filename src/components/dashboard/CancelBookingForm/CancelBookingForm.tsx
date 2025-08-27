/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/dashboard/CancelBookingForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function CancelBookingForm({
  bookingId,
}: {
  bookingId: string;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!bookingId) return;

    const ok = confirm("Cancel this appointment?");
    if (!ok) return;

    setPending(true);
    try {
      const res = await fetch("/api/book/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          reason: "User canceled via dashboard",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Could not cancel this booking.");
      } else {
        const refunded =
          typeof data?.refunded === "number"
            ? (data.refunded / 100).toFixed(2)
            : null;
        toast.success(
          refunded
            ? `Appointment canceled. $${refunded} refund initiated.`
            : "Appointment canceled."
        );
        router.refresh(); // update UI
      }
    } catch (err: any) {
      toast.error(err?.message || "Could not cancel this booking.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "inline" }}>
      <button
        type='submit'
        disabled={pending}
        style={{
          padding: "6px 12px",
          border: "1px solid #ddd",
          backgroundColor: pending ? "#c33" : "red",
          color: "white",
          borderRadius: 6,
          cursor: pending ? "not-allowed" : "pointer",
          opacity: pending ? 0.8 : 1,
        }}
      >
        {pending ? "Canceling…" : "Cancel"}
      </button>
    </form>
  );
}
