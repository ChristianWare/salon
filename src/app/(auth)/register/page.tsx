import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import RegisterPageIntro from "@/components/registerPage/RegisterPageIntro";

export default async function RegisterPage() {
  const session = await auth();
  if (session) redirect("/dashboard");
  return <RegisterPageIntro />;
}
