import { auth } from "../../../../auth";
import UserButton from "../UserButton/UserButton";
import styles from "./DashboardPageIntro.module.css";

export default async function DashboardPageIntro() {
  const session = await auth();

  return (
    <section className={styles.container}>
      <h1>{session?.user?.name}&lsquo;s Dashboard</h1>
      <UserButton />
    </section>
  );
}
