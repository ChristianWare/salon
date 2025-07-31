import styles from "./AdminPageIntro.module.css";
import { auth } from "../../../../auth";

export default async function AdminPageIntro() {
  const session = await auth();

  return (
    <section className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.heading}>
          {session?.user?.name}&lsquo;s <br />
          Admin Dashboard
        </h1>{" "}
        <p className={styles.copy}>
          Welcome to the admin dashboard! Here you can manage bookings,
          groomers, services, customers, and more.
        </p>
      </div>
    </section>
  );
}
