"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  autoConfirm: boolean;
  minLeadMinutes: number;
  bufferMin: number;
  emailOptIn: boolean;
  smsOptIn: boolean;
  notificationPhone: string | null;
};

export default function SettingsForm({
  initial,
  onSave,
}: {
  initial: Initial;
  onSave: (fd: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [autoConfirm, setAutoConfirm] = useState(initial.autoConfirm);
  const [minLeadMinutes, setMinLeadMinutes] = useState(initial.minLeadMinutes);
  const [bufferMin, setBufferMin] = useState(initial.bufferMin);
  const [emailOptIn, setEmailOptIn] = useState(initial.emailOptIn);
  const [smsOptIn, setSmsOptIn] = useState(initial.smsOptIn);
  const [notificationPhone, setNotificationPhone] = useState(
    initial.notificationPhone ?? ""
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const fd = new FormData();
      if (autoConfirm) fd.set("autoConfirm", "on");
      if (emailOptIn) fd.set("emailOptIn", "on");
      if (smsOptIn) fd.set("smsOptIn", "on");
      fd.set("minLeadMinutes", String(minLeadMinutes));
      fd.set("bufferMin", String(bufferMin));
      if (notificationPhone) fd.set("notificationPhone", notificationPhone);

      await onSave(fd);
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 20 }}>
      {/* Booking behavior */}
      <fieldset style={fs}>
        <legend style={lg}>Booking Behavior</legend>
        <label style={row}>
          <input
            type='checkbox'
            checked={autoConfirm}
            onChange={(e) => setAutoConfirm(e.target.checked)}
          />
          <span>Automatically confirm new bookings</span>
        </label>

        <div style={grid2}>
          <label>
            <div style={label}>Minimum lead time (minutes)</div>
            <input
              type='number'
              min={0}
              value={minLeadMinutes}
              onChange={(e) =>
                setMinLeadMinutes(parseInt(e.target.value || "0", 10))
              }
              style={input}
            />
          </label>

          <label>
            <div style={label}>Buffer per appointment (minutes)</div>
            <input
              type='number'
              min={0}
              value={bufferMin}
              onChange={(e) =>
                setBufferMin(parseInt(e.target.value || "0", 10))
              }
              style={input}
            />
          </label>
        </div>
        <p style={hint}>
          Lead time prevents last‑minute bookings. Buffer is added after each
          service to allow cleanup or prep.
        </p>
      </fieldset>

      {/* Notifications */}
      <fieldset style={fs}>
        <legend style={lg}>Notifications</legend>

        <label style={row}>
          <input
            type='checkbox'
            checked={emailOptIn}
            onChange={(e) => setEmailOptIn(e.target.checked)}
          />
          <span>Email notifications</span>
        </label>

        <label style={row}>
          <input
            type='checkbox'
            checked={smsOptIn}
            onChange={(e) => setSmsOptIn(e.target.checked)}
          />
          <span>SMS notifications</span>
        </label>

        <label>
          <div style={label}>Notification phone (E.164, e.g. +16025551234)</div>
          <input
            type='tel'
            value={notificationPhone}
            onChange={(e) => setNotificationPhone(e.target.value)}
            placeholder='+16025551234'
            style={input}
            disabled={!smsOptIn}
          />
        </label>
      </fieldset>

      <div>
        <button type='submit' disabled={pending}>
          {pending ? "Updating…" : "Save Settings"}
        </button>
      </div>
    </form>
  );
}

/* Tiny style helpers */
const fs: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 8,
  padding: "12px 14px",
};

const lg: React.CSSProperties = { fontWeight: 600, padding: "0 6px" };
const row: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  margin: "6px 0",
};
const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};
const label: React.CSSProperties = {
  fontSize: 13,
  color: "#555",
  marginBottom: 4,
};
const hint: React.CSSProperties = { fontSize: 12, color: "#777", marginTop: 6 };
const input: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #ddd",
  borderRadius: 6,
  width: "100%",
};
