import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import LoginPageIntro from "@/components/loginPage/LoginPageIntro/LoginPageIntro";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard"); 
  return (
    <main>
      <LoginPageIntro />
    </main>
  );
}
