// src/app/(admin)/customers/page.tsx
import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import RoleCheckboxes from "@/components/admin/RoleCheckboxes/RoleCheckboxes";

export default async function AdminCustomersPage() {
  /*────────────────────  Access guard  ────────────────────*/
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  /*────────────────────  Data fetch  ──────────────────────*/
  const [customers, groomers] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    db.groomer.findMany({ where: { active: true }, select: { id: true } }),
  ]);

  const groomerIds = new Set(groomers.map((g) => g.id));

  /*────────────────────  Render  ──────────────────────────*/
  return (
    <section style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Customers</h1>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Roles</th>
              <th style={th}>Joined</th>
              <th style={th}>Edit Roles</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((u) => {
              /* Build a readable role string, e.g. “Admin · Groomer · User” */
              const roleText = [
                u.role === "ADMIN" && "Admin",
                groomerIds.has(u.id) && "Groomer",
                "User",
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <tr key={u.id}>
                  <td style={td}>{u.name ?? "—"}</td>
                  <td style={td}>{u.email}</td>
                  <td style={td}>{roleText}</td>
                  <td style={td}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>

                  <td style={td}>
                    {/* The two check-boxes + confirm dialog / instant refresh */}
                    <RoleCheckboxes
                      userId={u.id}
                      isAdmin={u.role === "ADMIN"}
                      isGroomer={groomerIds.has(u.id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* Simple inline table styles */
const th = { border: "1px solid #ddd", padding: 8, background: "#fafafa" };
const td = { border: "1px solid #ddd", padding: 8 };
