import AdminSideNav from "@/components/admin/AdminSideNav/AdminSideNav";
import { requireAdmin } from "./lib/rbac";
// import SideNav

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className='flex min-h-screen'>
      <AdminSideNav />
      <main className='flex-1 p-6 bg-muted'>{children}</main>
    </div>
  );
}
