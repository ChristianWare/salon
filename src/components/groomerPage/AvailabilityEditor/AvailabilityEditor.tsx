/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
type Opt = { value: string; label: string };

/* Build 15-minute increments from 06:00 → 20:00 */
function buildTimeOpts(startHour = 6, endHour = 20): Opt[] {
  const out: Opt[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const value = `${hh}:${mm}`;
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? "AM" : "PM";
      out.push({ value, label: `${h12}:${mm} ${ampm}` });
    }
  }
  return out;
}
const timeOpts = buildTimeOpts();

/* Helpers */
const isAfter = (a: string, b: string) => a > b; // "HH:MM" lexicographic works
const DEFAULT_START = "09:00";
const DEFAULT_END = "17:00";

export default function AvailabilityEditor({
  initial,
  onChange,
}: {
  initial: Record<string, [string, string][]>;
  onChange: (json: Record<string, [string, string][]>) => void;
}) {
  /* Local row state: we support one window per day (first slot only) */
  const [state, setState] = useState<
    Record<string, { enabled: boolean; start: string; end: string }>
  >(
    DAYS.reduce((acc, d) => {
      const slot = initial[d]?.[0];
      acc[d] = {
        enabled: Boolean(slot),
        start: slot?.[0] || DEFAULT_START,
        end: slot?.[1] || DEFAULT_END,
      };
      return acc;
    }, {} as any)
  );

  const errors = useMemo(() => {
    const e: Record<string, string | null> = {};
    for (const d of DAYS) {
      const { enabled, start, end } = state[d];
      e[d] =
        enabled && !isAfter(end, start)
          ? "End time must be after start."
          : null;
    }
    return e;
  }, [state]);

  /* Lift normalized JSON on every change */
  useEffect(() => {
    const json = DAYS.reduce(
      (obj, d) => {
        const { enabled, start, end } = state[d];
        obj[d] = enabled ? [[start, end]] : [];
        return obj;
      },
      {} as Record<string, [string, string][]>
    );
    onChange(json);
  }, [state, onChange]);

  /* Quick actions */
  const setDay = (
    d: string,
    patch: Partial<{ enabled: boolean; start: string; end: string }>
  ) => setState((s) => ({ ...s, [d]: { ...s[d], ...patch } }));

  const weekdays95 = () => {
    setState((s) => {
      const next = { ...s };
      for (const d of DAYS.slice(0, 5)) {
        next[d] = { enabled: true, start: "09:00", end: "17:00" };
      }
      for (const d of DAYS.slice(5)) {
        next[d] = { enabled: false, start: "09:00", end: "17:00" };
      }
      return next;
    });
  };

  const copyMonToAll = () => {
    const mon = state["Mon"];
    setState((s) => {
      const next = { ...s };
      for (const d of DAYS) {
        next[d] = { ...mon };
      }
      return next;
    });
  };

  const clearAll = () => {
    setState((s) => {
      const next = { ...s };
      for (const d of DAYS)
        next[d] = { enabled: false, start: DEFAULT_START, end: DEFAULT_END };
      return next;
    });
  };

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
          Weekly Availability
        </h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type='button' onClick={weekdays95} style={outlineBtn}>
            Weekdays 9–5
          </button>
          <button type='button' onClick={copyMonToAll} style={outlineBtn}>
            Copy Monday → all
          </button>
          <button type='button' onClick={clearAll} style={outlineBtn}>
            Clear all
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
              <th style={th}>Day</th>
              <th style={th}>Enable</th>
              <th style={th}>Start</th>
              <th style={th}>End</th>
              <th style={th}>Note</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((d) => {
              const row = state[d];
              const hasErr = !!errors[d];
              return (
                <tr key={d} style={{ borderTop: "1px solid #eee" }}>
                  <td style={td} aria-label={`${d} label`}>
                    <strong>{d}</strong>
                  </td>
                  <td style={td}>
                    <input
                      type='checkbox'
                      checked={row.enabled}
                      onChange={(e) => setDay(d, { enabled: e.target.checked })}
                    />
                  </td>
                  <td style={td}>
                    <select
                      disabled={!row.enabled}
                      value={row.start}
                      onChange={(e) => {
                        const start = e.target.value;
                        let end = row.end;
                        // auto-bump end if it is not after start
                        if (!isAfter(end, start)) {
                          // find the next slot after start, else keep as-is
                          const idx = timeOpts.findIndex(
                            (t) => t.value === start
                          );
                          const next = timeOpts[idx + 1]?.value ?? end;
                          end = isAfter(next, start) ? next : end;
                        }
                        setDay(d, { start, end });
                      }}
                      style={select}
                    >
                      {timeOpts.map(({ value, label }) => (
                        <option key={`${d}-start-${value}`} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={td}>
                    <select
                      disabled={!row.enabled}
                      value={row.end}
                      onChange={(e) => setDay(d, { end: e.target.value })}
                      style={select}
                    >
                      {timeOpts.map(({ value, label }) => (
                        <option key={`${d}-end-${value}`} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={td}>
                    {row.enabled ? (
                      hasErr ? (
                        <span style={{ color: "#b33636", fontSize: 12 }}>
                          {errors[d]}
                        </span>
                      ) : (
                        <span style={{ color: "#666", fontSize: 12 }}>
                          {row.start}–{row.end}
                        </span>
                      )
                    ) : (
                      <span style={{ color: "#666", fontSize: 12 }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
        Note: This editor supports one time window per day. If you need split
        shifts (e.g., 9–12 and 1–5), we can extend this to multiple windows per
        day.
      </div>
    </section>
  );
}

/* inline styles to match your pattern */
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

const select: React.CSSProperties = {
  padding: "6px 10px",
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
