import { auth } from "../../../auth";
import { redirect } from "next/navigation";

import DashboardPageIntro from "@/components/dashboard/DashboardPageIntro/DashboardPageIntro";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <main>
      <DashboardPageIntro />
    </main>
  );
}
