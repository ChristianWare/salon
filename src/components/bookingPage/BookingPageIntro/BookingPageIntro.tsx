import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./BookingPageIntro.module.css";
import Nav from "@/components/shared/Nav/Nav";

export default function BookingPageIntro() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <Nav />
        <div className={styles.content}>
          <h1 className={styles.heading}>Book an appointment</h1>
          <p className={styles.copy}>
            Choose a service, pick a groomer and date, then select an available
            time.
          </p>
        </div>
      </LayoutWrapper>
    </section>
  );
}
