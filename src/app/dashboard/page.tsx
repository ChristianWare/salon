import { auth } from "../../../auth";
import { redirect } from "next/navigation";

import DashboardPageIntro from "@/components/dashboard/DashboardPageIntro/DashboardPageIntro";

export default async function DashboardPage() {
  const session = await auth();

  console.log(session);
  if (!session) redirect("/login");

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }
  return (
    <main>
      <DashboardPageIntro />
    </main>
  );
}
