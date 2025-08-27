// app/(admin)/admin/bookings/_ActionBar.t
"use client";

import { useTransition } from "react";
import { Toaster, toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  cancelBookingSA,
  markCompletedSA,
  markNoShowSA,
} from "../../../app/(admin)/admin/bookings/_actions";

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

  const handleCompleted = () =>
    start(async () => {
      const res = await markCompletedSA(bookingId);
      if (res.ok) {
        toast.success("Marked completed");
        router.refresh();
      } else {
        toast.error("Could not mark completed");
      }
    });

  const handleNoShow = () =>
    start(async () => {
      const res = await markNoShowSA(bookingId);
      if (res.ok) {
        toast.success("Marked no-show");
        router.refresh();
      } else {
        toast.error("Could not mark no-show");
      }
    });

  const onCancel = (formData: FormData) =>
    start(async () => {
      const reason = String(formData.get("reason") || "");
      const res = await cancelBookingSA(bookingId, reason);
      if (res.ok) {
        toast.success("Appointment canceled"); // ← your requested toast.success
        router.refresh();
      } else {
        toast.error(res.error || "Could not cancel");
      }
    });

  const isCompleted = status === "COMPLETED";
  const isNoShow = status === "NO_SHOW";

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
            action={onCancel}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <input
              type='text'
              name='reason'
              placeholder='Reason (optional)'
              style={{ ...input, width: 260 }}
            />
            <button type='submit' style={dangerBtn} disabled={pending}>
              Cancel Booking
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
