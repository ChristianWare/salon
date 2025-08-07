"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleRole } from "@/app/(admin)/admin/customers/toggleRole";
export default function RoleToggleButton({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: "ADMIN" | "USER";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const label = currentRole === "ADMIN" ? "Make User" : "Make Admin";

  const handleClick = () =>
    startTransition(async () => {
      const ok = window.confirm(
        `Are you sure you want to ${label.toLowerCase()}?`
      );
      if (!ok) return;
      await toggleRole(userId);
      router.refresh(); // updates table immediately
    });

  return (
    <button onClick={handleClick} disabled={pending}>
      {pending ? "Applying…" : label}
    </button>
  );
}
