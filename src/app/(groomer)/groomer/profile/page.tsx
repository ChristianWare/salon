// src/app/groomer/profile/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireGroomer } from "@/lib/rbac";
import ProfileEditor from "@/components/groomerPage/ProfileEditor/ProfileEditor";

export const dynamic = "force-dynamic";

/* ────────────────────────────────────────────────
   Server Action: Save Profile (bio + specialties)
──────────────────────────────────────────────── */
export async function saveProfile(formData: FormData) {
  "use server";
  const user = await requireGroomer();

  const bio = ((formData.get("bio") as string) || "").trim();
  const specsRaw = (formData.get("specialties") as string) || "";

  await db.groomer.update({
    where: { id: user.id },
    data: {
      bio,
      specialties: specsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    },
  });
}

/* ────────────────────────────────────────────────
   Page
──────────────────────────────────────────────── */
export default async function GroomerProfilePage() {
  const user = await requireGroomer();

  // fetch groomer profile fields
  const groomer = await db.groomer.findUnique({
    where: { id: user.id },
    select: {
      bio: true,
      specialties: true,
      workingHours: true, // not edited here but needed by ProfileEditor signature
    },
  });

  if (!groomer) redirect("/login");

  // also show account info (read-only)
  const account = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, image: true },
  });

  return (
    <section style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Your Profile</h1>

      {/* Account summary (read-only) */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          padding: "1rem",
          border: "1px solid #eee",
          borderRadius: 8,
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#f2f2f2",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 600,
          }}
          aria-label='Avatar'
        >
          {account?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={account.image}
              alt='Avatar'
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            (account?.name?.[0] || "?").toUpperCase()
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{account?.name ?? "—"}</div>
          <div style={{ color: "#666" }}>{account?.email ?? "—"}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Wire these to your existing settings routes when ready */}
          <a href='/settings' style={linkBtn}>
            Change Password
          </a>
          <a href='/settings' style={outlineBtn}>
            Update Avatar
          </a>
        </div>
      </div>

      {/* Editable profile fields: bio + specialties (with “Updating…” state) */}
      <ProfileEditor
        initialBio={groomer.bio || ""}
        initialSpecs={groomer.specialties}
        initialWorking={groomer.workingHours as any}
        onSave={saveProfile} // only saves bio & specialties here
      />

      {/* Optional extras you can add later:
          - Notification preferences (SMS/email toggles)
          - Auto-confirm toggle for instant booking vs pending
          - Service-specific notes (breed size limits, etc.)
          - Tip preferences (who receives tips, split policy)
      */}
    </section>
  );
}

const linkBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  background: "#0366d6",
  color: "#fff",
  textDecoration: "none",
  fontSize: 14,
};

const outlineBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #0366d6",
  color: "#0366d6",
  textDecoration: "none",
  fontSize: 14,
};
