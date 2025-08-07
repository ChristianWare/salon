import { requireGroomer } from "@/lib/rbac";
import styles from "./GroomerLayout.module.css";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import Nav from "@/components/shared/Nav/Nav";
import GroomerSideNav from "@/components/groomerPage/GroomerSideNav/GroomerSideNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireGroomer();

  return (
    <main>
      <section className={styles.container}>
        <LayoutWrapper>
          <Nav />
          <div className={styles.content}>
            <div className={styles.left}>
              <div className={styles.AdminSideNavContainer}>
                <GroomerSideNav />
              </div>
            </div>
            <div className={styles.right}>{children}</div>
          </div>
        </LayoutWrapper>
      </section>
    </main>
  );
}
