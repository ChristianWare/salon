import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./AdminPageIntro.module.css";
import Nav from "@/components/shared/Nav/Nav";
import { auth } from "../../../../auth";
import UserButton from "@/components/dashboard/UserButton/UserButton";
import Button from "@/components/shared/Button/Button";
import AdminSideNav from "../AdminSideNav/AdminSideNav";

export default async function AdminPageIntro() {
  const session = await auth();

  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <Nav />
        <div className={styles.content}>
          <div className={styles.left}>
            <AdminSideNav />
          </div>
          <div className={styles.right}>
            <h1 className={styles.heading}>
              {session?.user?.name}&lsquo;s <br />
              Admin Dashboard
            </h1>{" "}
            <p className={styles.copy}>
              Welcome to your dashboard! Here you can manage your account, view
              your bookings, and access other features.
            </p>
            <div className={styles.btnContainer}>
              <UserButton />
              <Button btnType='blue' text='Go Home' href='/' />
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
