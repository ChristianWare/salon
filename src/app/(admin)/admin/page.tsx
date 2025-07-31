import { redirect } from "next/navigation";
import { auth } from "../../../../auth";

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <div>
      <p>Admin overview here</p>

    </div>
  );
}
