import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import LoginPageIntro from "@/components/loginPage/LoginPageIntro/LoginPageIntro";

export default async function LoginPage() {
  const session = await auth();
  
  if (session) {
    const isAdmin = session.user.role === "ADMIN";
    const isGroomer = !!session.user.isGroomer;
    const dest = isAdmin ? "/admin" : isGroomer ? "/groomer" : "/dashboard";
    redirect(dest);
  }
  return (
    <main>
      <LoginPageIntro />
    </main>
  );
}
