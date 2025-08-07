// src/app/(admin)/groomers/page.tsx
import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";

export default async function GroomersPage() {
  // 1. Admin guard
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // 2. Fetch active groomers, ordering by the related user's name
  const groomers = await db.groomer.findMany({
    where: { active: true },
    orderBy: {
      user: { name: "asc" },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // 3. Render
  return (
    <section style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Groomers</h1>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Bio</th>
              <th style={th}>Specialties</th>
              <th style={th}>Active?</th>
            </tr>
          </thead>
          <tbody>
            {groomers.map((g) => (
              <tr key={g.id}>
                <td style={td}>{g.user.name ?? "—"}</td>
                <td style={td}>{g.user.email}</td>
                <td style={td}>{g.bio ?? "—"}</td>
                <td style={td}>
                  {g.specialties.length > 0 ? g.specialties.join(", ") : "—"}
                </td>
                <td style={td}>{g.active ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Inline styles
const th = { border: "1px solid #ddd", padding: 8, background: "#fafafa" };
const td = { border: "1px solid #ddd", padding: 8 };
