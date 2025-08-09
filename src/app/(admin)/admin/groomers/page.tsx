// src/app/(admin)/groomers/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { $Enums, type Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_PATH = "/admin/groomers";

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

export default async function GroomersPage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  // 1) Admin guard
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // 2) Parse filters/sorting/pagination
  const spObj = await searchParams;
  const sp = new URLSearchParams(
    Object.entries(spObj).reduce<Record<string, string>>((acc, [k, v]) => {
      if (Array.isArray(v)) acc[k] = v[0] ?? "";
      else if (v != null) acc[k] = v;
      return acc;
    }, {})
  );

  const q = getStr(spObj, "q").trim();
  const activeParam = getStr(spObj, "active").trim(); // "", "true", "false"
  const sort = getStr(spObj, "sort") || "name"; // name | createdAt | active
  const order = (getStr(spObj, "order") || "asc") as "asc" | "desc";

  const page = Math.max(1, getNum(spObj, "page", 1));
  const pageSize = Math.min(100, getNum(spObj, "pageSize", 20));

const where: Prisma.GroomerWhereInput = {
  // Exclude admins; only users with standard USER role
  user: { role: $Enums.UserRole.USER },

  ...(activeParam === "true" ? { active: true } : {}),
  ...(activeParam === "false" ? { active: false } : {}),

  ...(q
    ? {
        OR: [
          { user: { name: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
          { bio: { contains: q, mode: "insensitive" } },
          { specialties: { has: q } },
          { id: { contains: q, mode: "insensitive" } },
        ],
      }
    : {}),
};


  // orderBy
  // Groomer has no createdAt; keep to valid fields
  const orderBy: Prisma.GroomerOrderByWithRelationInput =
    sort === "active"
      ? { active: order }
      : sort === "name"
        ? { user: { name: order } }
        : { id: order }; // fallback

  // 3) Fetch data + counts
  const [groomers, total, activeGroups] = await db.$transaction([
    db.groomer.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    db.groomer.count({ where }),
    db.groomer.groupBy({
      by: ["active"],
      _count: { _all: true },
      orderBy: { active: "desc" },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  // TS-safe map for active counts
  let activeCount = 0;
  let inactiveCount = 0;
  for (const row of activeGroups) {
    const c =
      typeof row._count === "object" && row._count ? (row._count._all ?? 0) : 0;
    if (row.active) activeCount = c;
    else inactiveCount = c;
  }

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
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Groomers</h1>
        <div style={{ fontSize: 14, color: "#666" }}>
          {total.toLocaleString()} total
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
        <div style={{ minWidth: 260, flex: "1 1 300px" }}>
          <input
            type='text'
            name='q'
            defaultValue={q}
            placeholder='Search name, email, bio, specialty…'
            style={input}
          />
        </div>

        <div style={{ minWidth: 160 }}>
          <select name='active' defaultValue={activeParam} style={select}>
            <option value=''>All statuses</option>
            <option value='true'>Active</option>
            <option value='false'>Inactive</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <select name='sort' defaultValue={sort} style={select}>
            <option value='name'>Sort by Name</option>
            <option value='createdAt'>Sort by Created</option>
            <option value='active'>Sort by Active</option>
          </select>
          <select name='order' defaultValue={order} style={select}>
            <option value='asc'>Asc</option>
            <option value='desc'>Desc</option>
          </select>
        </div>

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
          href={buildHref(sp, { active: null, page: "1" })}
          current={!activeParam}
          label={`All (${total})`}
        />
        <Pill
          href={buildHref(sp, { active: "true", page: "1" })}
          current={activeParam === "true"}
          label={`Active (${activeCount})`}
        />
        <Pill
          href={buildHref(sp, { active: "false", page: "1" })}
          current={activeParam === "false"}
          label={`Inactive (${inactiveCount})`}
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
              <th style={th}>Bio</th>
              <th style={th}>Specialties</th>
              <th style={th}>Active?</th>
            </tr>
          </thead>
          <tbody>
            {groomers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ padding: 16, textAlign: "center", color: "#666" }}
                >
                  No groomers match your filters.
                </td>
              </tr>
            ) : (
              groomers.map((g) => (
                <tr key={g.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={td}>{g.user?.name ?? "—"}</td>
                  <td style={td}>{g.user?.email ?? "—"}</td>
                  <td style={td}>{g.bio ?? "—"}</td>
                  <td style={td}>
                    {g.specialties?.length ? g.specialties.join(", ") : "—"}
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 999,
                        color: "white",
                        background: g.active ? "#0a7" : "#999",
                        fontSize: 12,
                      }}
                    >
                      {g.active ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              ))
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

/* ───────────── UI helpers ───────────── */
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

/* shared inline styles to match your other page */
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
