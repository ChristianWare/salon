"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function BlockedDatesEditor({
  initialDates,
  onAddBreak,
  onRemoveBreak,
}: {
  initialDates: { id: string; date: string }[];
  onAddBreak: (formData: FormData) => Promise<void>;
  onRemoveBreak: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [date, setDate] = useState("");

  const handleAdd = () => {
    if (!date) return;
    start(async () => {
      const fd = new FormData();
      fd.set("date", date);
      await onAddBreak(fd);
      router.refresh();
      setDate("");
    });
  };

  const handleRemove = (id: string) => {
    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await onRemoveBreak(fd);
      router.refresh();
    });
  };

  return (
    <section style={{ marginBottom: "2rem" }}>
      <h2>Blocked Dates</h2>
      <ul>
        {initialDates.map((b) => (
          <li key={b.id} style={{ marginBottom: "0.5rem" }}>
            {new Date(b.date).toLocaleDateString()}{" "}
            <button
              onClick={() => handleRemove(b.id)}
              disabled={pending}
              style={{ marginLeft: "0.5rem" }}
            >
              {pending ? "Removing…" : "Remove"}
            </button>
          </li>
        ))}
      </ul>
      <div>
        <input
          type='date'
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={pending}
        />
        <button
          onClick={handleAdd}
          disabled={pending || !date}
          style={{ marginLeft: "0.5rem" }}
        >
          {pending ? "Adding…" : "Add Block Date"}
        </button>
      </div>
    </section>
  );
}
