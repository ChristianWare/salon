/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/dashboard/CancelBookingForm.tsx
"use client";

import { useEffect } from "react";
import { useActionState } from "react"; // ⬅️ React 19
import { useFormStatus } from "react-dom"; // still from react-dom
import toast from "react-hot-toast";
import { cancelBooking as originalCancelBooking } from "@/app/(dashboard)/dashboard/my-bookings/actions";

type State = { ok?: boolean; error?: string } | undefined;
const initialState: State = undefined;

// Adapter so we can surface toast-friendly state
async function cancelBooking(
  _state: State,
  formData: FormData
): Promise<State> {
  try {
    await originalCancelBooking(formData);
    return { ok: true };
  } catch (error: any) {
    return { error: error?.message || "Failed to cancel booking." };
  }
}

export default function CancelBookingForm({
  bookingId,
}: {
  bookingId: string;
}) {
  const [state, formAction] = useActionState<State, FormData>(
    cancelBooking,
    initialState
  );

  useEffect(() => {
    if (!state) return;
    if (state.error) toast.error(state.error);
    else if (state.ok) toast.success("Booking canceled.");
  }, [state]);

  return (
    <form action={formAction} style={{ display: "inline" }}>
      <input type='hidden' name='id' value={bookingId} />
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type='submit'
      disabled={pending}
      onClick={(e) => {
        if (!confirm("Cancel this appointment?")) e.preventDefault();
      }}
      style={{ padding: "6px 12px", border: "1px solid #ddd", borderRadius: 6 }}
    >
      {pending ? "Canceling…" : "Cancel"}
    </button>
  );
}
