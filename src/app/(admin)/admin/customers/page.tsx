// src/app/(admin)/customers/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import RoleCheckboxes from "@/components/admin/RoleCheckboxes/RoleCheckboxes";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_PATH = "/admin/customers";

type SearchParamsPromise = Promise<
  Record<string, string | string[] | undefined>
>;

function getStr(
  sp: Record<string, string | string[] | undefined>,
  key: string,
  fallback = ""
) {
  const v = sp[key];
  return Array.isArray(v) ? (v[0] ?? fallback) : (v ?? fallback);
}
function getNum(
  sp: Record<string, string | string[] | undefined>,
  key: string,
  fallback: number
) {
  const n = Number(getStr(sp, key, ""));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
function buildHref(prev: URLSearchParams, next: Record<string, string | null>) {
  const q: Record<string, string> = Object.fromEntries(prev.entries());
  for (const [k, v] of Object.entries(next)) {
    if (v === null) delete q[k];
    else q[k] = v;
  }
  return { pathname: BASE_PATH, query: q } as const;
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  /*────────────────────  Access guard  ────────────────────*/
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  /*────────────────────  Parse query  ─────────────────────*/
  const spObj = await searchParams;
  const sp = new URLSearchParams(
    Object.entries(spObj).reduce<Record<string, string>>((acc, [k, v]) => {
      if (Array.isArray(v)) acc[k] = v[0] ?? "";
      else if (v != null) acc[k] = v;
      return acc;
    }, {})
  );

  const q = getStr(spObj, "q").trim();
  // tab: "all" | "admins" | "groomers" | "users"
  const tab = (getStr(spObj, "tab") || "all") as
    | "all"
    | "admins"
    | "groomers"
    | "users";
  const sort = getStr(spObj, "sort") || "createdAt"; // createdAt | name | email
  const order = (getStr(spObj, "order") || "desc") as "asc" | "desc";
  const page = Math.max(1, getNum(spObj, "page", 1));
  const pageSize = Math.min(100, getNum(spObj, "pageSize", 20));

  /*────────────────────  Build where/order  ───────────────*/
  // Base where by tab
  let where: any = {};
  if (tab === "admins") where.role = "ADMIN";
  if (tab === "users") where.role = "USER";
  if (tab === "groomers")
    where = { ...where, groomer: { is: { active: true } } }; // any groomer record

  if (q) {
    where = {
      ...where,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { id: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const orderBy =
    sort === "name"
      ? { name: order }
      : sort === "email"
        ? { email: order }
        : { createdAt: order };

  /*────────────────────  Data fetch  ──────────────────────*/
  const [rows, total, totalUsers, adminCount, userCount, groomerCount] =
    await db.$transaction([
      db.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          groomer: { select: { active: true } },
        },
      }),
      db.user.count({ where }),
      db.user.count(),
      db.user.count({ where: { role: "ADMIN" } }),
      db.user.count({ where: { role: "USER" } }),
      db.groomer.count({ where: { active: true } }),
    ]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  /*────────────────────  Render  ──────────────────────────*/
  return (
    <section style={{ padding: "2rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: "1rem",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Customers</h1>
        <div style={{ fontSize: 14, color: "#666" }}>
          {total.toLocaleString()} result{total === 1 ? "" : "s"}
        </div>
      </div>

      {/* Filters */}
      <form
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "end",
          marginBottom: 12,
        }}
      >
        <div style={{ minWidth: 260, flex: "1 1 320px" }}>
          <label style={label}>Search</label>
          <input
            name='q'
            defaultValue={q}
            placeholder='Search name, email, id…'
            style={input}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div>
            <label style={label}>Sort</label>
            <select name='sort' defaultValue={sort} style={select}>
              <option value='createdAt'>Joined</option>
              <option value='name'>Name</option>
              <option value='email'>Email</option>
            </select>
          </div>
          <div>
            <label style={label}>Order</label>
            <select name='order' defaultValue={order} style={select}>
              <option value='desc'>Desc</option>
              <option value='asc'>Asc</option>
            </select>
          </div>
        </div>

        <input type='hidden' name='tab' value={tab} />
        <input type='hidden' name='page' value='1' />
        <input type='hidden' name='pageSize' value={pageSize} />

        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button type='submit' style={primaryBtn}>
            Apply
          </button>
          <Link href={{ pathname: BASE_PATH, query: {} }} style={outlineBtn}>
            Clear
          </Link>
        </div>
      </form>

      {/* Quick filter pills */}
      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
      >
        <Pill
          href={buildHref(sp, { tab: "all", page: "1" })}
          current={tab === "all"}
          label={`All (${totalUsers})`}
        />
        <Pill
          href={buildHref(sp, { tab: "admins", page: "1" })}
          current={tab === "admins"}
          label={`Admins (${adminCount})`}
        />
        <Pill
          href={buildHref(sp, { tab: "groomers", page: "1" })}
          current={tab === "groomers"}
          label={`Groomers (${groomerCount})`}
        />
        <Pill
          href={buildHref(sp, { tab: "users", page: "1" })}
          current={tab === "users"}
          label={`Users (${userCount})`}
        />
      </div>

      {/* Table */}
      <div
        style={{
          overflowX: "auto",
          border: "1px solid #e5e5e5",
          borderRadius: 8,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
          }}
        >
          <thead
            style={{
              position: "sticky",
              top: 0,
              background: "#fafafa",
              zIndex: 1,
            }}
          >
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Roles</th>
              <th style={th}>Joined</th>
              <th style={th}>Edit Roles</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ padding: 16, textAlign: "center", color: "#666" }}
                >
                  No customers match your filters.
                </td>
              </tr>
            ) : (
              rows.map((u) => {
                const roleText = [
                  u.role === "ADMIN" && "Admin",
                  u.groomer?.active && "Groomer", // ← only when active
                  "User",
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <tr key={u.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={td}>{u.name ?? "—"}</td>
                    <td style={td}>{u.email}</td>
                    <td style={td}>{roleText}</td>
                    <td style={td}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={td}>
                      <RoleCheckboxes
                        userId={u.id}
                        isAdmin={u.role === "ADMIN"}
                        isGroomer={!!u.groomer?.active}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
        }}
      >
        <div style={{ fontSize: 14, color: "#666" }}>
          Showing{" "}
          {total === 0
            ? "0"
            : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`}{" "}
          of {total}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {page <= 1 ? (
            <span
              style={{ ...outlineBtn, opacity: 0.5, pointerEvents: "none" }}
            >
              Previous
            </span>
          ) : (
            <Link
              href={buildHref(sp, { page: String(page - 1) })}
              style={outlineBtn}
            >
              Previous
            </Link>
          )}
          {page >= pages ? (
            <span
              style={{ ...outlineBtn, opacity: 0.5, pointerEvents: "none" }}
            >
              Next
            </span>
          ) : (
            <Link
              href={buildHref(sp, { page: String(page + 1) })}
              style={outlineBtn}
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/* ───────────── UI helpers / styles ───────────── */

function Pill({
  href,
  current,
  label,
}: {
  href: any;
  current?: boolean;
  label: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        textDecoration: "none",
        border: "1px solid #ddd",
        background: current ? "#111" : "white",
        color: current ? "white" : "#333",
        fontSize: 13,
      }}
    >
      {label}
    </Link>
  );
}

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
const select: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
  minWidth: 140,
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
  textDecoration: "none",
};
const th: React.CSSProperties = {
  borderBottom: "1px solid #e5e5e5",
  padding: 10,
  background: "#fafafa",
  textAlign: "left",
  position: "sticky",
  top: 0,
  zIndex: 1,
};
const td: React.CSSProperties = {
  borderBottom: "1px solid #f0f0f0",
  padding: 10,
};
