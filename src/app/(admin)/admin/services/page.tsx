/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import ConfirmSubmit from "@/components/shared/ConfirmSubmit/ConfirmSubmit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_PATH = "/admin/services";

/*─────────────────────────────  Server actions  ───────────────────────────*/
export async function createService(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Unauthorized");

  const name = (formData.get("name") as string)?.trim();
  const duration = Number(formData.get("duration"));
  const price = Number(formData.get("price"));
  if (!name || isNaN(duration) || isNaN(price))
    throw new Error("Invalid input");

  await db.service.create({
    data: {
      name,
      durationMin: duration,
      priceCents: Math.round(price * 100),
    },
  });

  revalidatePath(BASE_PATH);
}

export async function updateService(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const duration = Number(formData.get("duration"));
  const price = Number(formData.get("price"));
  const active = formData.get("active") === "on";

  await db.service.update({
    where: { id },
    data: {
      name,
      durationMin: duration,
      priceCents: Math.round(price * 100),
      active,
    },
  });

  revalidatePath(BASE_PATH);
}

export async function deactivateService(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  await db.service.update({ where: { id }, data: { active: false } });

  revalidatePath(BASE_PATH);
}

export async function activateService(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  await db.service.update({ where: { id }, data: { active: true } });

  revalidatePath(BASE_PATH);
}

export async function deleteService(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Unauthorized");

  const id = formData.get("id") as string;

  try {
    await db.service.delete({ where: { id } });
  } catch (e: any) {
    // Friendly message if there are bookings referencing this service
    if (e?.code === "P2003") {
      throw new Error(
        "Cannot delete a service that has existing bookings. Deactivate it instead."
      );
    }
    throw e;
  } finally {
    revalidatePath(BASE_PATH);
  }
}

/*──────────────────────────────  Page component  ──────────────────────────*/
export default async function AdminServicesPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const services = await db.service.findMany({ orderBy: { name: "asc" } });

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
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Services</h1>
        <div style={{ fontSize: 14, color: "#666" }}>
          {services.length} total
        </div>
      </div>

      {/* ── Create New Service ─────────────────── */}
      <form
        action={createService}
        style={{
          display: "flex",
          gap: 8,
          alignItems: "end",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 240, flex: "1 1 260px" }}>
          <label style={label}>Name</label>
          <input name='name' placeholder='Name' required style={input} />
        </div>
        <div>
          <label style={label}>Duration (min)</label>
          <input
            name='duration'
            type='number'
            min='1'
            placeholder='Minutes'
            required
            style={input}
          />
        </div>
        <div>
          <label style={label}>Price ($)</label>
          <input
            name='price'
            type='number'
            min='0'
            step='0.01'
            placeholder='Price $'
            required
            style={input}
          />
        </div>
        <button type='submit' style={primaryBtn}>
          Create
        </button>
      </form>

      {/* ── Services Table ─────────────────────── */}
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
              <th style={th}>Duration</th>
              <th style={th}>Price</th>
              <th style={th}>Active</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ padding: 16, textAlign: "center", color: "#666" }}
                >
                  No services yet.
                </td>
              </tr>
            ) : (
              services.map((s) => {
                const editFormId = `edit-${s.id}`;
                const deactFormId = `deact-${s.id}`;
                const actFormId = `act-${s.id}`;
                const delFormId = `del-${s.id}`; // ← add this

                return (
                  <tr key={s.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={td}>
                      <input
                        name='name'
                        defaultValue={s.name}
                        form={editFormId}
                        required
                        style={{ ...input, width: "100%" }}
                      />
                    </td>
                    <td style={td}>
                      <input
                        name='duration'
                        type='number'
                        defaultValue={s.durationMin}
                        form={editFormId}
                        required
                        style={{ ...input, width: 100 }}
                      />
                    </td>
                    <td style={td}>
                      <input
                        name='price'
                        type='number'
                        step='0.01'
                        defaultValue={(s.priceCents / 100).toFixed(2)}
                        form={editFormId}
                        required
                        style={{ ...input, width: 120 }}
                      />
                    </td>
                    <td style={{ ...td, textAlign: "center" }}>
                      <input
                        name='active'
                        type='checkbox'
                        defaultChecked={s.active}
                        form={editFormId}
                      />
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type='submit'
                          form={editFormId}
                          style={primaryBtn}
                        >
                          Save
                        </button>
                        {s.active ? (
                          <button
                            type='submit'
                            form={deactFormId}
                            style={outlineBtn}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type='submit'
                            form={actFormId}
                            style={outlineBtn}
                          >
                            Activate
                          </button>
                        )}
                        <ConfirmSubmit
                          form={delFormId}
                          message={`Delete “${s.name}”? This cannot be undone.`}
                        >
                          Delete
                        </ConfirmSubmit>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Hidden Forms Outside Table ─────────── */}
      {services.map((s) => (
        <div key={s.id} style={{ display: "none" }}>
          <form id={`edit-${s.id}`} action={updateService}>
            <input type='hidden' name='id' value={s.id} />
          </form>
          <form id={`deact-${s.id}`} action={deactivateService}>
            <input type='hidden' name='id' value={s.id} />
          </form>
          <form id={`act-${s.id}`} action={activateService}>
            <input type='hidden' name='id' value={s.id} />
          </form>

          {/* ← add this */}
          <form id={`del-${s.id}`} action={deleteService}>
            <input type='hidden' name='id' value={s.id} />
          </form>
        </div>
      ))}
    </section>
  );
}

/*──────────────────────────────  Tiny styles  ─────────────────────────────*/
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
};
const outlineBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  background: "white",
  color: "#333",
  border: "1px solid #ddd",
  cursor: "pointer",
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
