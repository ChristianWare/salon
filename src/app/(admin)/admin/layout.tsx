import { requireAdmin } from "./lib/rbac";
// import AdminPageIntro from "@/components/admin/AdminPageIntro/AdminPageIntro";
// import SideNav

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <>
      <main >
        {children}
      </main>
    </>
  );
}
