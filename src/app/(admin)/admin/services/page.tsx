import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";

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
}

export async function deactivateService(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  await db.service.update({ where: { id }, data: { active: false } });
}

/*──────────────────────────────  Page component  ──────────────────────────*/
export default async function AdminServicesPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const services = await db.service.findMany({ orderBy: { name: "asc" } });

  return (
    <section style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Services</h1>

      {/* ── Create New Service ─────────────────── */}
      <form action={createService} style={{ marginBottom: "2rem" }}>
        <strong>Add Service:&nbsp;</strong>
        <input name='name' placeholder='Name' required />
        &nbsp;
        <input
          name='duration'
          type='number'
          min='1'
          placeholder='Minutes'
          required
          style={{ width: 80 }}
        />
        &nbsp;
        <input
          name='price'
          type='number'
          min='0'
          step='0.01'
          placeholder='Price $'
          required
          style={{ width: 90 }}
        />
        &nbsp;
        <button type='submit'>Create</button>
      </form>

      {/* ── Services Table ─────────────────────── */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Duration</th>
              <th style={th}>Price</th>
              <th style={th}>Active</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => {
              const editFormId = `edit-${s.id}`;
              const deactFormId = `deact-${s.id}`;
              return (
                <tr key={s.id}>
                  <td style={td}>
                    <input
                      name='name'
                      defaultValue={s.name}
                      form={editFormId}
                      required
                      style={{ width: "95%" }}
                    />
                  </td>
                  <td style={td}>
                    <input
                      name='duration'
                      type='number'
                      defaultValue={s.durationMin}
                      form={editFormId}
                      required
                      style={{ width: 60 }}
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
                      style={{ width: 70 }}
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
                    <button
                      type='submit'
                      form={editFormId}
                      style={{ marginRight: 8 }}
                    >
                      Save
                    </button>
                    <button type='submit' form={deactFormId}>
                      Deactivate
                    </button>
                  </td>
                </tr>
              );
            })}
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
        </div>
      ))}
    </section>
  );
}

/*──────────────────────────────  Tiny styles  ─────────────────────────────*/
const th = { border: "1px solid #ddd", padding: 8, background: "#fafafa" };
const td = { border: "1px solid #ddd", padding: 8 };
