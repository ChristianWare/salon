/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/admin/ActionBar/ActionBar.tsx
"use client";

import { useTransition } from "react";
import { Toaster, toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  markCompletedSA,
  markNoShowSA,
} from "@/app/(admin)/admin/bookings/_actions";

export default function ActionBar({
  bookingId,
  status,
  isCanceled,
}: {
  bookingId: string;
  status: string;
  isCanceled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  type ActionResult = { ok: boolean; error?: string };

  const handleCompleted = () =>
    start(async () => {
      const res: ActionResult = await markCompletedSA(bookingId);
      if (res.ok) {
        toast.success("Marked completed");
        router.refresh();
      } else {
        toast.error(res.error || "Could not mark completed");
      }
    });

  const handleNoShow = () =>
    start(async () => {
      const res: ActionResult = await markNoShowSA(bookingId);
      if (res.ok) {
        toast.success("Marked no-show");
        router.refresh();
      } else {
        toast.error(res.error || "Could not mark no-show");
      }
    });

  // Admin-initiated cancel + refund through API route (so refund receipts are visible to both sides)
  const handleAdminCancel = (formData: FormData) =>
    start(async () => {
      const reason = String(formData.get("reason") || "").trim();

      try {
        const res = await fetch("/api/book/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId, reason, actor: "admin" }),
        });

        const data: any = await res.json().catch(() => ({}));

        if (res.ok && data?.ok) {
          const msg =
            typeof data.refunded === "number" && data.refunded > 0
              ? "Appointment canceled & refunded"
              : "Appointment canceled";
          toast.success(msg);
          router.refresh();
        } else {
          toast.error(data?.error || "Could not cancel");
        }
      } catch {
        toast.error("Could not cancel");
      }
    });

  const isCompleted = status === "COMPLETED";
  const isNoShow = status === "NO_SHOW";

  const cancelDisabled = isCanceled || isCompleted || isNoShow || pending;

  return (
    <>
      {/* Remove this Toaster if you already render one globally */}
      <Toaster position='top-right' />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          type='button'
          onClick={handleCompleted}
          style={outlineBtn}
          disabled={isCanceled || pending}
          title={isCanceled ? "Cannot complete a canceled booking" : undefined}
        >
          Mark Completed
        </button>

        <button
          type='button'
          onClick={handleNoShow}
          style={outlineBtn}
          disabled={isCanceled || pending}
          title={isCanceled ? "Cannot no-show a canceled booking" : undefined}
        >
          Mark No-Show
        </button>

        {isCanceled ? (
          <span
            style={{ ...outlineBtn, opacity: 0.6, pointerEvents: "none" }}
            title='This booking is already canceled'
          >
            Already canceled
          </span>
        ) : isCompleted ? (
          <span
            style={{ ...outlineBtn, opacity: 0.6 }}
            title='Completed bookings can’t be canceled'
          >
            Completed — no cancellation
          </span>
        ) : isNoShow ? (
          <span
            style={{ ...outlineBtn, opacity: 0.6 }}
            title='No-show bookings can’t be canceled'
          >
            No-show — no cancellation
          </span>
        ) : (
          <form
            action={handleAdminCancel}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
            onSubmit={(e) => {
              if (
                !confirm(
                  "Cancel this appointment and issue a refund for any captured amount?"
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <input
              type='text'
              name='reason'
              placeholder='Reason (optional)'
              style={{ ...input, width: 260 }}
            />
            <button type='submit' style={dangerBtn} disabled={cancelDisabled}>
              {pending ? "Canceling…" : "Cancel Booking"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

/* inline tokens to match your admin UI */
const input: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
};
const outlineBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  background: "white",
  color: "#333",
  border: "1px solid #ddd",
  cursor: "pointer",
};
const dangerBtn: React.CSSProperties = {
  ...outlineBtn,
  borderColor: "#e5a0a0",
  color: "#b33636",
};
