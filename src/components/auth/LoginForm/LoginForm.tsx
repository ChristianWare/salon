/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import styles from "./LoginForm.module.css";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginSchemaType } from "@/schemas/LoginSchema";
import FormField from "../FormField/FormField";
import FalseButton from "@/components/shared/FalseButton/FalseButton";
import GoogleButton from "../GoogleButton/GoogleButton";
import Link from "next/link";
import { useState, useTransition } from "react";
import { login } from "../../../../actions/auth/login";
import Alert from "@/components/shared/Alert/Alert";
import { useRouter, useSearchParams } from "next/navigation";
import { LOGIN_REDIRECT } from "../../../../routes";
import { signIn, getSession } from "next-auth/react";

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({ resolver: zodResolver(LoginSchema) });

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const searchParams = useSearchParams();
  const router = useRouter();

  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "Email in use with different provider!"
      : "";

  const onSubmit: SubmitHandler<LoginSchemaType> = async (data) => {
    // ① log the user in WITHOUT an automatic redirect
    const result = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
    });

    if (result?.error) {
      setError(result.error);
      return;
    }

    // ② wait a tick so the auth cookie is written
    await new Promise((r) => setTimeout(r, 50));

    // ③ read the fresh session
    const session = await getSession();
    console.log(session);
    if (!session) {
      setError("Could not establish session—please try again.");
      return;
    }

    // ④ decide where to go
    const destination = session.user.role === "ADMIN" ? "/admin" : "/dashboard";

    // ⑤ replace() keeps browser history clean
    router.replace(destination);
  };

  return (
    <div className={styles.container}>
      <GoogleButton title='in' />
      <p className={styles.or}>or</p>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <FormField
          id='email'
          register={register}
          errors={errors}
          placeholder='email'
          label='email'
          disabled={isPending}
        />
        <FormField
          id='password'
          register={register}
          errors={errors}
          placeholder='password'
          type='password'
          label='password'
          disabled={isPending}
          eye
        />
        {error && <Alert message={error} error />}
        {urlError && <Alert message={urlError} error />}
        {success && <Alert message={success} success />}

        <div className={styles.btnContainer}>
          <FalseButton
            text={isPending ? "Submitting..." : "Sign In"}
            type='submit'
            btnType='orange'
            disabled={isPending}
          />
        </div>
      </form>
      <footer className={styles.cardFooter}>
        <p className={styles.footerText}>
          Don’t have an account?{" "}
          <Link href='/register' className={styles.link}>
            Sign up
          </Link>
        </p>
      </footer>
      <footer className={styles.cardFooter}>
        <p className={styles.footerText}>
          Forgot password?{" "}
          <Link href='/password-email-form' className={styles.link}>
            Click here
          </Link>
        </p>
      </footer>
    </div>
  );
}
