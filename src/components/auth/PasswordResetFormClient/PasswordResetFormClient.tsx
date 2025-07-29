"use client";

import styles from "./PasswordResetFormClient.module.css";
import Alert from "@/components/shared/Alert/Alert";
import FalseButton from "@/components/shared/FalseButton/FalseButton";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import FormField from "../FormField/FormField";
import { useSearchParams } from "next/navigation";
import {
  PasswordResetSchema,
  PasswordResetSchemaType,
} from "@/schemas/PasswordResetSchema";
import { passwordReset } from "../../../../actions/auth/password-reset";

export default function PasswordResetFormClient() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetSchemaType>({
    resolver: zodResolver(PasswordResetSchema),
  });

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const searchParmas = useSearchParams();
  const token = searchParmas.get("token");

  const onSubmit: SubmitHandler<PasswordResetSchemaType> = (data) => {
    setError("");
    startTransition(() => {
      passwordReset(data, token).then((res) => {
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
        <p>Enter your new password:</p>
        <FormField
          id='password'
          register={register}
          errors={errors}
          placeholder='password'
          label='password'
          disabled={isPending}
          type='password'
          eye
        />
        <FormField
          id='confirmPassword'
          register={register}
          errors={errors}
          placeholder='Confirm password'
          label='Confirm password'
          disabled={isPending}
          type='password'
          eye
        />

        {error && <Alert message={error} error />}
        {success && <Alert message={success} success />}

        <div className={styles.btnContainer}>
          <FalseButton
            text={isPending ? "Submitting..." : "Save new password"}
            type='submit'
            btnType='blue'
            disabled={isPending}
          />
        </div>
      </form>
    </div>
  );
}
