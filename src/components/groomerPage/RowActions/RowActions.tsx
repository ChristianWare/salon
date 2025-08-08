"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function RowActions({
  bookingId,
  onSetStatus,
  canConfirm,
  canCancel,
  canComplete,
  canNoShow,
}: {
  bookingId: string;
  onSetStatus: (fd: FormData) => Promise<void>; // server action from page
  canConfirm: boolean;
  canCancel: boolean;
  canComplete: boolean;
  canNoShow: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const setStatus = (status: string, confirmText?: string) => {
    start(async () => {
      if (confirmText && !window.confirm(confirmText)) return;
      const fd = new FormData();
      fd.set("id", bookingId);
      fd.set("status", status);
      await onSetStatus(fd);
      router.refresh();
    });
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {canConfirm && (
        <button disabled={pending} onClick={() => setStatus("CONFIRMED")}>
          {pending ? "Applying…" : "Confirm"}
        </button>
      )}
      {canComplete && (
        <button
          disabled={pending}
          onClick={() =>
            setStatus("COMPLETED", "Mark this appointment as completed?")
          }
        >
          {pending ? "Applying…" : "Complete"}
        </button>
      )}
      {canNoShow && (
        <button
          disabled={pending}
          onClick={() =>
            setStatus("NO_SHOW", "Mark this appointment as no-show?")
          }
        >
          {pending ? "Applying…" : "No-Show"}
        </button>
      )}
      {canCancel && (
        <button
          disabled={pending}
          onClick={() => setStatus("CANCELED", "Cancel this appointment?")}
        >
          {pending ? "Applying…" : "Cancel"}
        </button>
      )}
    </div>
  );
}
