"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AvailabilityEditor from "../AvailabilityEditor/AvailabilityEditor";

export default function ProfileEditor({
  initialBio,
  initialSpecs,
  initialWorking,
  onSave, // now passed in as prop
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
  const [working, setWorking] = useState(initialWorking);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const fd = new FormData();
      fd.set("bio", bio);
      fd.set("specialties", specs);
      fd.set("workingHours", JSON.stringify(working));
      await onSave(fd);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <label>
          <strong>Bio</strong>
          <br />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            style={{ width: "100%" }}
          />
        </label>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label>
          <strong>Specialties</strong> (comma-separated)
          <br />
          <input
            value={specs}
            onChange={(e) => setSpecs(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>
      </div>

      <AvailabilityEditor initial={initialWorking} onChange={setWorking} />

      <button type='submit' disabled={pending}>
        {pending ? "Updating…" : "Save Profile"}
      </button>
    </form>
  );
}
