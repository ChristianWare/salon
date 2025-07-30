import styles from "./ContactPageIntro.module.css";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import Nav from "@/components/shared/Nav/Nav";


export default function ContactPageIntro() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <Nav />
        <div className={styles.content}>
          <h1 className={styles.heading}>Get in touch</h1>
          <p className={styles.copy}>
            We&#39;re here to answer any questions you may have about our
            services, pricing, or anything else related to dog grooming.
          </p>
        </div>
      </LayoutWrapper>
    </section>
  );
}
