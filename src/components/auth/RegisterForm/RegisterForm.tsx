"use client";

import styles from "./RegisterForm.module.css";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormField from "../FormField/FormField";
import FalseButton from "@/components/shared/FalseButton/FalseButton";
import GoogleButton from "../GoogleButton/GoogleButton";
import Link from "next/link";
import { RegisterSchema, RegisterSchemaType } from "@/schemas/RegisterSchema";
import { signUp } from "../../../../actions/auth/register";
import { useTransition, useState } from "react";
import Alert from "@/components/shared/Alert/Alert";

export default function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchemaType>({ resolver: zodResolver(RegisterSchema) });

  const onSubmit: SubmitHandler<RegisterSchemaType> = (data) => {
    setSuccess("");
    setError("");
    startTransition(() => {
      signUp(data).then((res) => {
        setError(res.error);
        setSuccess(res.success);
      });
    });
  };
  return (
    <div className={styles.container}>
      <GoogleButton title='up' />
      <p className={styles.or}>or</p>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <FormField
          id='name'
          register={register}
          errors={errors}
          placeholder='name'
          label='name'
          disabled={isPending}
        />
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
        <FormField
          id='confirmPassword'
          register={register}
          errors={errors}
          placeholder='Conform Password'
          type='password'
          label='Confirm Password'
          disabled={isPending}
          eye
        />
        {error && <Alert message={error} error />}
        {success && <Alert message={success} success />}
        <div className={styles.btnContainer}>
          <FalseButton
            text={isPending ? "Submitting..." : "Register"}
            type='submit'
            btnType='orange'
            disabled={isPending}
          />
        </div>
      </form>
      <footer className={styles.cardFooter}>
        <p className={styles.footerText}>
          Already have an account?{" "}
          <Link href='/login' className={styles.link}>
            Sign in
          </Link>
        </p>
      </footer>
    </div>
  );
}
