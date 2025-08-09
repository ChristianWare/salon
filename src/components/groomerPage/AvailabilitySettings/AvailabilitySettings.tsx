"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AvailabilityEditor from "../AvailabilityEditor/AvailabilityEditor";

export default function AvailabilitySettings({
  initialWorking,
  onSave,
}: {
  initialWorking: Record<string, [string, string][]>;
  onSave: (fd: FormData) => Promise<void>; // server action from page
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [working, setWorking] = useState(initialWorking);

  const initialJson = useMemo(
    () => JSON.stringify(initialWorking),
    [initialWorking]
  );
  const dirty = useMemo(
    () => JSON.stringify(working) !== initialJson,
    [working, initialJson]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    start(async () => {
      const fd = new FormData();
      fd.set("workingHours", JSON.stringify(working));
      await onSave(fd);
      router.refresh();
    });
  };

  const handleReset = () => {
    if (!dirty) return;
    setWorking(initialWorking);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 12 }}>
        <AvailabilityEditor initial={initialWorking} onChange={setWorking} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type='submit'
          disabled={pending || !dirty}
          style={{ ...primaryBtn, opacity: pending || !dirty ? 0.6 : 1 }}
        >
          {pending ? "Saving…" : "Save Availability"}
        </button>
        <button
          type='button'
          onClick={handleReset}
          disabled={pending || !dirty}
          style={{ ...outlineBtn, opacity: pending || !dirty ? 0.6 : 1 }}
        >
          Reset
        </button>
      </div>
    </form>
  );
}

/* inline styles to match the rest of your UI */
const primaryBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  background: "#111",
  color: "white",
  border: "1px solid #111",
  cursor: "pointer",
};

const outlineBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  background: "white",
  color: "#333",
  border: "1px solid #ddd",
  cursor: "pointer",
};
