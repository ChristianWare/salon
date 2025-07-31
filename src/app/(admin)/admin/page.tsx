import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import AdminPageIntro from "@/components/admin/AdminPageIntro/AdminPageIntro";

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <div>
      <AdminPageIntro />

      <p>Admin overview here</p>
    </div>
  );
}
