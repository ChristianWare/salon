// src/app/groomer/profile/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireGroomer } from "@/lib/rbac";
import ProfileEditor from "@/components/groomerPage/ProfileEditor/ProfileEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_PATH = "/groomer/profile";

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

  // instant refresh
  revalidatePath(BASE_PATH);
}

/* ────────────────────────────────────────────────
   Page
──────────────────────────────────────────────── */
export default async function GroomerProfilePage() {
  const user = await requireGroomer();

  const groomer = await db.groomer.findUnique({
    where: { id: user.id },
    select: {
      bio: true,
      specialties: true,
      workingHours: true, // ProfileEditor expects this in props
      active: true,
    },
  });
  if (!groomer) redirect("/login");

  const account = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, image: true, createdAt: true },
  });

  const joined =
    account?.createdAt &&
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(account.createdAt));

  return (
    <section style={{ padding: "2rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 12,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
          Groomer Profile
        </h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href='/groomer' style={outlineBtn}>
            Dashboard
          </Link>
          <Link href='/groomer/my-bookings' style={outlineBtn}>
            My Bookings
          </Link>
          <Link href='/groomer/availability' style={outlineBtn}>
            Availability
          </Link>
        </div>
      </div>

      {/* Account summary */}
      <div
        style={{
          ...card,
          display: "grid",
          gridTemplateColumns: "72px 1fr auto",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        {/* Avatar */}
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
            border: "1px solid #eee",
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
            (account?.name?.[0] || account?.email?.[0] || "?")
              .toString()
              .toUpperCase()
          )}
        </div>

        {/* Info */}
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontWeight: 600 }}>{account?.name ?? "—"}</div>
          <div style={{ color: "#666" }}>{account?.email ?? "—"}</div>
          <div style={{ color: "#666", fontSize: 12 }}>
            Joined {joined ?? "—"} ·{" "}
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                color: groomer.active ? "#065f46" : "#6b7280",
                background: groomer.active ? "#d1fae5" : "#f3f4f6",
                border: `1px solid ${groomer.active ? "#a7f3d0" : "#e5e7eb"}`,
                fontSize: 12,
              }}
            >
              {groomer.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href='/account/settings' style={outlineBtn}>
            Update Avatar
          </Link>
          <Link href='/account/settings' style={outlineBtn}>
            Change Password
          </Link>
        </div>
      </div>

      {/* Profile editor card */}
      <section style={card}>
        <h2 style={h2}>Edit Profile</h2>
        <p style={{ margin: "4px 0 12px 0", color: "#555" }}>
          Update your bio and specialties. Your availability and breaks are
          managed separately on the Availability page.
        </p>

        <ProfileEditor
          initialBio={groomer.bio || ""}
          initialSpecs={groomer.specialties}
          initialWorking={groomer.workingHours as any}
          onSave={saveProfile}
        />
      </section>
    </section>
  );
}

/* ───────────── inline styles (consistent) ───────────── */
const h2: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  margin: "0 0 8px 0",
};

const card: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 8,
  padding: 12,
  background: "white",
};

const outlineBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  background: "white",
  color: "#333",
  border: "1px solid #ddd",
  cursor: "pointer",
  textDecoration: "none",
};
