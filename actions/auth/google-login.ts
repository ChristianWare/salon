// actions/auth/google-login.ts
"use server";
import { signIn } from "../../auth";
import { AuthError } from "next-auth";

export async function googleAuthenticate() {
  try {
    await signIn("google", { redirectTo: "/login" });
  } catch (error) {
    if (error instanceof AuthError) return "google log in failed";
    throw error;
  }
}
