"use client";

import {  useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { verifyEmail } from "../../../../actions/auth/email-verification";
import Alert from "@/components/shared/Alert/Alert";
import Button from "@/components/shared/Button/Button";

export default function EmailVerificationClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [pending, setPending] = useState<boolean>(true);


  useEffect(() => {
    setPending(true);
    if (!token) return setError("Missing verification token");
    verifyEmail(token).then((res) => {
      setSuccess(res.success);
      setError(res.error);
    });
    setPending(false);
  }, [token]);

  return (
    <div>
      <div>
        {pending && <div>Verifying email...</div>}
        {success && <Alert message={success} success />}
        {error && <Alert message={error} error />}
        {success && <Button text='Login' btnType='blue' href='/login' />}
      </div>
    </div>
  );
}
