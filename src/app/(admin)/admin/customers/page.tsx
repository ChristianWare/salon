// src/app/(admin)/customers/page.tsx
import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function AdminCustomersPage() {
  // 1. Admin guard
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // 2. Fetch all users
  const customers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  // 3. Render table
  return (
    <section style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Customers</h1>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Role</th>
              <th style={th}>Joined</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((u) => (
              <tr key={u.id}>
                <td style={td}>{u.name ?? "—"}</td>
                <td style={td}>{u.email}</td>
                <td style={td}>
                  {u.role === "ADMIN"
                    ? "Admin"
                    : u.role === "USER"
                      ? "Basic User"
                      : u.role}
                </td>
                <td style={td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={td}>
                  <Link
                    href={`/admin/customers/${u.id}`}
                    style={{ color: "#0366d6", textDecoration: "underline" }}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Tiny style helpers
const th = { border: "1px solid #ddd", padding: 8, background: "#fafafa" };
const td = { border: "1px solid #ddd", padding: 8 };
