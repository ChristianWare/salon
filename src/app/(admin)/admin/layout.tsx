import { requireAdmin } from "./lib/rbac";
import styles from "./Layout.module.css";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import Nav from "@/components/shared/Nav/Nav";
import AdminSideNav from "@/components/admin/AdminSideNav/AdminSideNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <main>
      <section className={styles.container}>
        <LayoutWrapper>
          <Nav />
          <div className={styles.content}>
            <div className={styles.left}>
              <div className={styles.AdminSideNavContainer}>
                <AdminSideNav />
              </div>
            </div>
            <div className={styles.right}>{children}</div>
          </div>
        </LayoutWrapper>
      </section>
    </main>
  );
}
