/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireGroomer } from "@/lib/rbac";
import ProfileEditor from "@/components/groomerPage/ProfileEditor/ProfileEditor";
import BlockedDatesEditor from "@/components/groomerPage/BlockedDatesEditor/BlockedDatesEditor";

/*─────────────────────────────────────────────────
  1️⃣ Server Action: Update Profile
──────────────────────────────────────────────────*/
export async function updateProfile(formData: FormData) {
  "use server";
  const user = await requireGroomer();

  const bio = (formData.get("bio") as string).trim();
  const specsRaw = (formData.get("specialties") as string) || "";
  const workingRaw = (formData.get("workingHours") as string) || "{}";

  let workingHours: Record<string, [string, string][]>;
  try {
    workingHours = JSON.parse(workingRaw);
  } catch {
    throw new Error("Invalid workingHours JSON");
  }

  await db.groomer.update({
    where: { id: user.id },
    data: {
      bio,
      specialties: specsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      workingHours,
    },
  });
}

/*─────────────────────────────────────────────────
  2️⃣ Server Action: Add Break Date
──────────────────────────────────────────────────*/
export async function addBreak(formData: FormData) {
  "use server";
  const user = await requireGroomer();

  const dateStr = formData.get("date") as string;
  const date = new Date(dateStr);
  if (isNaN(date.valueOf())) throw new Error("Invalid date");

  if (!user.id) throw new Error("Missing groomer ID");
  await db.break.create({
    data: {
      groomerId: user.id!,
      date,
    },
  });
}

/*─────────────────────────────────────────────────
  3️⃣ Server Action: Remove Break Date
──────────────────────────────────────────────────*/
export async function removeBreak(formData: FormData) {
  "use server";
  await requireGroomer();

  const id = formData.get("id") as string;
  await db.break.delete({ where: { id } });
}

/*─────────────────────────────────────────────────
  4️⃣ Groomer Dashboard Page
──────────────────────────────────────────────────*/
export default async function GroomerDashboardPage() {
  const user = await requireGroomer();
  const groomer = await db.groomer.findUnique({
    where: { id: user.id },
    include: { breaks: { orderBy: { date: "asc" } } },
  });
  if (!groomer) redirect("/login");

  const blockedDates = groomer.breaks.map((b) => ({
    id: b.id,
    date: b.date.toISOString(),
  }));

  return (
    <section style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Your Groomer Profile</h1>

      <ProfileEditor
        initialBio={groomer.bio || ""}
        initialSpecs={groomer.specialties}
        initialWorking={groomer.workingHours as any}
        onSave={updateProfile} // pass the server action down
      />

      <BlockedDatesEditor
        initialDates={blockedDates}
        onAddBreak={addBreak}
        onRemoveBreak={removeBreak}
      />
    </section>
  );
}
