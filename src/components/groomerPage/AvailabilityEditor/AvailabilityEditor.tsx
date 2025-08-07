/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
type Opt = { value: string; label: string };

/* Build 15-minute increments 08:00 → 20:00 */
const timeOpts: Opt[] = Array.from({ length: 48 }, (_, i) => {
  const h24 = 8 + Math.floor(i / 4);
  const m = (i % 4) * 15;
  const value = `${h24.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const label = `${h12}:${m.toString().padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;

  return { value, label };
});

export default function AvailabilityEditor({
  initial,
  onChange,
}: {
  initial: Record<string, [string, string][]>;
  onChange: (json: Record<string, [string, string][]>) => void;
}) {
  const [state, setState] = useState<
    Record<string, { enabled: boolean; start: string; end: string }>
  >(
    DAYS.reduce((acc, d) => {
      const slot = initial[d]?.[0];
      acc[d] = {
        enabled: Boolean(slot),
        start: slot?.[0] || "08:00",
        end: slot?.[1] || "17:00",
      };
      return acc;
    }, {} as any)
  );

  // lift JSON up on every change
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

  return (
    <>
      <h3>Weekly Availability</h3>
      <table
        style={{
          width: "100%",
          marginBottom: "1rem",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th>Day</th>
            <th>Enable</th>
            <th>Start</th>
            <th>End</th>
          </tr>
        </thead>
        <tbody>
          {DAYS.map((d) => (
            <tr key={d}>
              <td>{d}</td>
              <td>
                <input
                  type='checkbox'
                  checked={state[d].enabled}
                  onChange={(e) =>
                    setState({
                      ...state,
                      [d]: { ...state[d], enabled: e.target.checked },
                    })
                  }
                />
              </td>
              <td>
                <select
                  disabled={!state[d].enabled}
                  value={state[d].start}
                  onChange={(e) =>
                    setState({
                      ...state,
                      [d]: { ...state[d], start: e.target.value },
                    })
                  }
                >
                  {timeOpts.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  disabled={!state[d].enabled}
                  value={state[d].end}
                  onChange={(e) =>
                    setState({
                      ...state,
                      [d]: { ...state[d], end: e.target.value },
                    })
                  }
                >
                  {timeOpts.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
