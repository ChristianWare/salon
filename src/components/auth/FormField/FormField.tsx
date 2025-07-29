"use client";

import styles from "./FormField.module.css";
import { useState } from "react";
import {
  FieldErrors,
  Path,
  UseFormRegister,
  FieldValues,
} from "react-hook-form";

import EyeOff from "@/components/icons/EyeOff/EyeOff";
import EyeOn from "@/components/icons/EyeOn/EyeOn";

interface FormFieldProps<T extends FieldValues> {
  id: string;
  type?: string;
  disabled?: boolean;
  placeholder: string;
  label?: string;
  //   inputClassNames?: string;
  register: UseFormRegister<T>;
  errors: FieldErrors;
  eye?: boolean;
}

export default function FormField<T extends FieldValues>({
  id,
  type,
  disabled,
  placeholder,
  label,
  //   inputClassNames,
  register,
  errors,
  eye = false,
}: FormFieldProps<T>) {
  const [show, setShow] = useState(false);
  const message = errors[id]?.message as string | undefined;
  const inputType =
    eye && type === "password" ? (show ? "text" : "password") : type;

  return (
    <div className={styles.formGroup}>
      {label && (
        <label htmlFor={type} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputWrapper}>
        <input
          id={id}
          disabled={disabled}
          placeholder={placeholder}
          type={inputType}
          {...register(id as Path<T>)}
          className={styles.input}
        />
        {eye && (
          <button
            type='button'
            onClick={() => setShow((v) => !v)}
            className={styles.eyeButton}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? (
              <EyeOn className={styles.icon} />
            ) : (
              <EyeOff className={styles.icon} />
            )}
          </button>
        )}
      </div>
      {message && <span className={styles.error}>{message}</span>}
    </div>
  );
}
