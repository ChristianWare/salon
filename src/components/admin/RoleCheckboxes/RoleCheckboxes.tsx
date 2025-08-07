/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateRoles } from "@/app/(admin)/admin/customers/updateRoles";

export default function RoleCheckboxes({
  userId,
  isAdmin,
  isGroomer,
}: {
  userId: string;
  isAdmin: boolean;
  isGroomer: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleChange(
    e: React.ChangeEvent<HTMLInputElement>,
    roleType: "ADMIN" | "GROOMER"
  ) {
    const newAdmin = roleType === "ADMIN" ? e.target.checked : isAdmin;
    const newGroomer = roleType === "GROOMER" ? e.target.checked : isGroomer;

    const ok = window.confirm(
      `Are you sure you want to ${
        e.target.checked ? "grant" : "remove"
      } ${roleType.toLowerCase()} rights?`
    );
    if (!ok) return;

    startTransition(async () => {
      try {
        await updateRoles(userId, newAdmin, newGroomer);
        router.refresh(); // instant UI update
      } catch (err: any) {
        alert(err.message || "Operation failed");
      }
    });
  }

  return (
    <>
      <label style={{ marginRight: 8 }}>
        <input
          type='checkbox'
          checked={isAdmin}
          disabled={pending}
          onChange={(e) => handleChange(e, "ADMIN")}
        />
        &nbsp;Admin
      </label>
      <label>
        <input
          type='checkbox'
          checked={isGroomer}
          disabled={pending}
          onChange={(e) => handleChange(e, "GROOMER")}
        />
        &nbsp;Groomer
      </label>
    </>
  );
}
