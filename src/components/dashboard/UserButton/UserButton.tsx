"use client";

import { signOut } from "next-auth/react";

import FalseButton from "@/components/shared/FalseButton/FalseButton";

export default function UserButton() {
  return (
    <FalseButton btnType='orange' onClick={() => signOut()}>
      Sign Out
    </FalseButton>
  );
}
