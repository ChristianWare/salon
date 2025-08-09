import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_PATH = "/account";

/* ───────────────── Server action: update profile ───────────────── */
export async function updateProfile(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  const image = (formData.get("image") as string)?.trim();

  if (!name) throw new Error("Name is required.");

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name,
      image: image || null,
    },
  });

  revalidatePath(BASE_PATH);
}

/* ───────────────── Page ───────────────── */
export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });
  if (!me) redirect("/login");

  const joined = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(me.createdAt));

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
          Profile & Settings
        </h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href='/dashboard' style={outlineBtn}>
            Dashboard
          </Link>
          <Link href='/dashboard/bookings' style={outlineBtn}>
            My Bookings
          </Link>
          <Link href='/book' style={primaryBtn}>
            Book Appointment
          </Link>
        </div>
      </div>

      {/* Summary card */}
      <div
        style={{
          ...card,
          display: "grid",
          gridTemplateColumns: "120px 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {me.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={me.image}
              alt='Avatar'
              width={96}
              height={96}
              style={{
                width: 96,
                height: 96,
                borderRadius: "999px",
                objectFit: "cover",
                border: "1px solid #eee",
              }}
            />
          ) : (
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "999px",
                background: "#f4f4f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                color: "#666",
                border: "1px solid #eee",
              }}
            >
              {me.name?.[0]?.toUpperCase() ?? me.email[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 12,
          }}
        >
          <Info label='Name' value={me.name ?? "—"} />
          <Info label='Email' value={me.email} />
          <Info label='Role' value={me.role} />
          <Info label='Joined' value={joined} />
        </div>
      </div>

      {/* Edit profile */}
      <section style={{ marginBottom: 16 }}>
        <h2 style={h2}>Edit Profile</h2>
        <form
          action={updateProfile}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div style={card}>
            <label style={label}>Name</label>
            <input
              name='name'
              defaultValue={me.name ?? ""}
              required
              style={input}
            />
          </div>
          <div style={card}>
            <label style={label}>Avatar URL</label>
            <input
              name='image'
              defaultValue={me.image ?? ""}
              placeholder='https://…'
              style={input}
            />
            <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              Paste a public image URL. (Uploads coming soon.)
            </div>
          </div>
          <div
            style={{ alignSelf: "stretch", display: "flex", alignItems: "end" }}
          >
            <button type='submit' style={primaryBtn}>
              Save Changes
            </button>
          </div>
        </form>
      </section>

      {/* Read-only account details */}
      <section>
        <h2 style={h2}>Account</h2>
        <div
          style={{
            ...card,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
            gap: 12,
          }}
        >
          <Info label='Email (read-only)' value={me.email} />
          <Info label='User ID' value={<code style={code}>{me.id}</code>} />
          {/* Add buttons as your project supports them; left minimal to avoid auth/verification tangles */}
          {session.user.role === "ADMIN" && (
            <div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                Admin
              </div>
              <Link href='/admin' style={outlineBtn}>
                Open Admin Panel
              </Link>
            </div>
          )}
          {/* If you expose a groomer panel for users who are groomers */}
          {session.user.isGroomer && (
            <div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                Groomer
              </div>
              <Link href='/groomer' style={outlineBtn}>
                Open Groomer Panel
              </Link>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

/* ───────────── little presentational bits ───────────── */

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontWeight: 500, wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

/* ───────────── inline styles (consistent with other pages) ───────────── */
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

const label: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#666",
  marginBottom: 4,
};

const input: React.CSSProperties = {
  width: "100%",
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
  textDecoration: "none",
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

const code: React.CSSProperties = {
  background: "#f6f8fa",
  border: "1px solid #eee",
  borderRadius: 6,
  padding: "2px 6px",
  fontSize: 12,
};
