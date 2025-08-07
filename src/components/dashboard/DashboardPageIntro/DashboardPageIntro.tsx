import styles from "./DashboardPageIntro.module.css";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import { auth } from "../../../../auth";
import UserButton from "../UserButton/UserButton";
import Nav from "@/components/shared/Nav/Nav";
import Button from "@/components/shared/Button/Button";
import Dog from "@/components/icons/Dog/Dog";

export default async function DashboardPageIntro() {
  const session = await auth();

  // if (session.user.role === "ADMIN") {
  //   redirect("/admin");
  // }

  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <Nav />
        <div className={styles.content}>
          <div className={styles.left}>
            <h1 className={styles.heading}>
              {session?.user?.name}&lsquo;s <br /> Dashboard
            </h1>{" "}
            <p className={styles.copy}>
              Welcome to your dashboard! Here you can manage your account, view
              your bookings, and access other features.
            </p>
            <div className={styles.btnContainer}>
              <UserButton />
              <Button btnType='white' text='Go Home' href='/' />
            </div>
            <div className={styles.adminBtnContainer}>
              {session?.user?.role === "ADMIN" && (
                <Button
                  btnType='whiteOutline'
                  text='Admin Panel'
                  href='/admin'
                />
              )}
              {session?.user?.isGroomer && (
                <Button
                  btnType='whiteOutline'
                  text='Groomer Panel'
                  href='/groomer'
                />
              )}
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.dogContainer}>
              <Dog className={styles.dog} />
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
