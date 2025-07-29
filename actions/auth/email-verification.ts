"use server";

import { db } from "@/lib/db";
import { getUserByEmail } from "@/lib/user";

export const verifyEmail = async (token: string) => {
  const emailVerificationToken = await db.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!emailVerificationToken)
    return { errir: "Verification token does not exist!" };

  const isExpired = new Date(emailVerificationToken.expires) < new Date();

  if (isExpired) return { error: "Verification token expired!" };

  const existingUser = await getUserByEmail(emailVerificationToken.email);

  if (!existingUser) return { error: "User does not exist!" };

  await db.user.update({
    where: { id: existingUser.id },
    data: { emailVerified: new Date(), email: emailVerificationToken.email },
  });

  return { success: "Email verified!" };
};
