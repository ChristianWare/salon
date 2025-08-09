"use client";

import { useMemo, useState, useTransition } from "react";
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

  // Sort ascending; build a Set for duplicate checks
  const sorted = useMemo(
    () =>
      [...initialDates].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [initialDates]
  );
  const existingISO = useMemo(
    () => new Set(sorted.map((d) => d.date.slice(0, 10))),
    [sorted]
  );

  const todayISO = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const handleAdd = () => {
    if (!date) return;
    if (date < todayISO) {
      alert("You can’t add a past date.");
      return;
    }
    if (existingISO.has(date)) {
      alert("That date is already blocked.");
      return;
    }

    start(async () => {
      const fd = new FormData();
      fd.set("date", date);
      await onAddBreak(fd);
      setDate("");
      router.refresh();
    });
  };

  const handleRemove = (id: string, dateLabel: string) => {
    const ok = window.confirm(`Remove blocked date: ${dateLabel}?`);
    if (!ok) return;

    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await onRemoveBreak(fd);
      router.refresh();
    });
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });

  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          Blocked Dates
        </h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type='date'
            value={date}
            min={todayISO}
            onChange={(e) => setDate(e.target.value)}
            disabled={pending}
            style={input}
          />
          <button
            onClick={handleAdd}
            disabled={pending || !date}
            style={{ ...primaryBtn, opacity: pending || !date ? 0.6 : 1 }}
          >
            {pending ? "Adding…" : "Add Date"}
          </button>
        </div>
      </div>

      <div
        style={{
          overflowX: "auto",
          border: "1px solid #e5e5e5",
          borderRadius: 8,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
          }}
        >
          <thead
            style={{
              position: "sticky",
              top: 0,
              background: "#fafafa",
              zIndex: 1,
            }}
          >
            <tr>
              <th style={th}>Date</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  style={{ padding: 16, textAlign: "center", color: "#666" }}
                >
                  No blocked dates.
                </td>
              </tr>
            ) : (
              sorted.map((b) => {
                const label = fmt(b.date);
                return (
                  <tr key={b.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={td}>{label}</td>
                    <td style={td}>
                      <button
                        onClick={() => handleRemove(b.id, label)}
                        disabled={pending}
                        style={{ ...outlineBtn, opacity: pending ? 0.6 : 1 }}
                      >
                        {pending ? "Removing…" : "Remove"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* inline styles consistent with your app */
const input: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
};

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

const th: React.CSSProperties = {
  borderBottom: "1px solid #e5e5e5",
  padding: 10,
  background: "#fafafa",
  textAlign: "left",
  position: "sticky",
  top: 0,
  zIndex: 1,
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #f0f0f0",
  padding: 10,
};
