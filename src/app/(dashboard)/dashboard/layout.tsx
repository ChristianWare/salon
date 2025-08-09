import { requireGroomer } from "@/lib/rbac";
import styles from "./UserLayout.module.css";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import Nav from "@/components/shared/Nav/Nav";
import UserSideNav from "@/components/dashboard/UserSideNav/UserSideNav";

export default async function UserLayout({
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
              <div className={styles.UserSideNavContainer}>
                <UserSideNav />
              </div>
            </div>
            <div className={styles.right}>{children}</div>
          </div>
        </LayoutWrapper>
      </section>
    </main>
  );
}
