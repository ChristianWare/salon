"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ProfileEditor({
  initialBio,
  initialSpecs,
  initialWorking,
  onSave, // server action
}: {
  initialBio: string;
  initialSpecs: string[];
  initialWorking: Record<string, [string, string][]>;
  onSave: (fd: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [bio, setBio] = useState(initialBio);
  const [specs, setSpecs] = useState(initialSpecs.join(", "));
  const [working, setWorking] = useState(initialWorking); // reserved for future inline editor

  const MAX_BIO = 1000;

  const chips = useMemo(() => tokenizeSpecs(specs), [specs]);
  const dirty = bio !== initialBio || specs !== initialSpecs.join(", ");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const fd = new FormData();
      fd.set("bio", bio.trim());
      fd.set("specialties", chips.join(", "));
      // keep workingHours in payload (even if server ignores it here)
      fd.set("workingHours", JSON.stringify(working || {}));
      await onSave(fd);
      router.refresh();
    });
  };

  const handleReset = () => {
    setBio(initialBio);
    setSpecs(initialSpecs.join(", "));
    setWorking(initialWorking);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Bio */}
      <div style={{ marginBottom: 12 }}>
        <label style={label}>Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={5}
          maxLength={MAX_BIO}
          placeholder='Tell clients about your experience, certifications, and what you love grooming.'
          style={textarea}
        />
        <div style={helpText}>
          {bio.length}/{MAX_BIO}
        </div>
      </div>

      {/* Specialties */}
      <div style={{ marginBottom: 12 }}>
        <label style={label}>Specialties</label>
        <input
          value={specs}
          onChange={(e) => setSpecs(e.target.value)}
          placeholder='e.g. doodles, seniors, nail trim, deshed'
          style={input}
        />
        <div style={helpText}>Comma-separated. Preview:</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {chips.length === 0 ? (
            <span style={{ color: "#666", fontSize: 12 }}>— none —</span>
          ) : (
            chips.map((c) => (
              <span key={c} style={chip}>
                {c}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type='submit'
          disabled={pending || !dirty}
          style={{ ...primaryBtn, opacity: pending || !dirty ? 0.6 : 1 }}
        >
          {pending ? "Saving…" : "Save Profile"}
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

/* ───────────── helpers ───────────── */
function tokenizeSpecs(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\s+/g, " ")) // collapse inner whitespace
    .slice(0, 24); // reasonable cap
}

/* ───────────── inline styles (match your pattern) ───────────── */
const label: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#666",
  marginBottom: 4,
};

const helpText: React.CSSProperties = {
  fontSize: 12,
  color: "#666",
  marginTop: 6,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
};

const textarea: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
  resize: "vertical",
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 8px",
  borderRadius: 999,
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
  fontSize: 12,
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
