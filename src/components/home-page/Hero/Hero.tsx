import Nav from "@/components/shared/Nav/Nav";
import styles from "./Hero.module.css";
import LayoutWrapper from "@/components/shared/LayoutWrapper";

export default function Hero() {
  return (
    <section className={styles.container}>
      <Nav />
      <div className={styles.content}>
        <LayoutWrapper>
          <h1 className={styles.heading}>Full range of dental services</h1>
          <p className={styles.description}>
            We provide comprehensive dental care, from routine check-ups to
            advanced treatments, ensuring your smile stays healthy and bright.
          </p>
        </LayoutWrapper>
      </div>
    </section>
  );
}
