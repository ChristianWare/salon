"use client";

import styles from "./PasswordEmailForm.module.css";
import Alert from "@/components/shared/Alert/Alert";
import FalseButton from "@/components/shared/FalseButton/FalseButton";
import {
  PasswordEmailSchema,
  PasswordEmailSchemaType,
} from "@/schemas/PasswordEmailSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import FormField from "../FormField/FormField";
import { passwordEmail } from "../../../../actions/auth/password-email";

export default function PasswordEmailForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordEmailSchemaType>({
    resolver: zodResolver(PasswordEmailSchema),
  });

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const onSubmit: SubmitHandler<PasswordEmailSchemaType> = (data) => {
    setError("");
    startTransition(() => {
      passwordEmail(data).then((res) => {
        if (res?.error) {
          setError(res.error);
        }
        
        if (res?.success) {
          setSuccess(res.success);
        }
      });
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <p>Forgot password?</p>
        <FormField
          id='email'
          register={register}
          errors={errors}
          placeholder='email'
          label='email'
          disabled={isPending}
        />

        {error && <Alert message={error} error />}
        {success && <Alert message={success} success />}

        <div className={styles.btnContainer}>
          <FalseButton
            text={isPending ? "Submitting..." : "Send reset email"}
            type='submit'
            btnType='blue'
            disabled={isPending}
          />
        </div>
      </form>
    </div>
  );
}
