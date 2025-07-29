/* eslint-disable @typescript-eslint/no-unused-vars */
import { db } from "./db";
import { v4 as uuidv4 } from "uuid";
import { Resend } from "resend";

export const getPasswordResetTokenByToken = async (token: string) => {
  try {
    const passwordResetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    return passwordResetToken;
  } catch (error) {
    return null;
  }
};

export const getPasswordResetTokenByEmail = async (email: string) => {
  try {
    const passwordResetToken = await db.passwordResetToken.findFirst({
      where: { email },
    });

    return passwordResetToken;
  } catch (error) {
    return null;
  }
};

export const generatePasswordResetToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  const existingToken = await getPasswordResetTokenByEmail(email);

  if (existingToken) {
    await db.passwordResetToken.delete({
      where: { id: existingToken.id },
    });
  }

  const passwordResetToken = await db.passwordResetToken.create({
    data: { email, token, expires },
  });

  return passwordResetToken;
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resend = await new Resend(process.env.RESEND_API_KEY);
  const resetLink = `${process.env.BASE_URL}/password-reset-form?token=${token}`;

  const res = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Password reset Link",
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password</p>`,
  });

  return { error: res.error };
};
