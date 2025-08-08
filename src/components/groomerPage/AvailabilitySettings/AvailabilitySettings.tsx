"use client";

import { useState, useTransition } from "react";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const fd = new FormData();
      fd.set("workingHours", JSON.stringify(working));
      await onSave(fd);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
      <AvailabilityEditor initial={initialWorking} onChange={setWorking} />
      <button type='submit' disabled={pending}>
        {pending ? "Updating…" : "Save Availability"}
      </button>
    </form>
  );
}
