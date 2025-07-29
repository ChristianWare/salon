"use client";

import { signOut } from "next-auth/react";

import styles from "./UserButton.module.css";
import FalseButton from "@/components/shared/FalseButton/FalseButton";

export default function UserButton() {
  return (
    <div className={styles.container}>
      <FalseButton btnType="blue" onClick={() => signOut()}>Sign Out</FalseButton>
    </div>
  );
}
