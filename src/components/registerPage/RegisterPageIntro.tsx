import styles from "./RegisterPageIntro.module.css";
import LayoutWrapper from "../shared/LayoutWrapper";
import Nav from "../shared/Nav/Nav";
import Register from "../icons/Register/Register";
import RegisterForm from "../auth/RegisterForm/RegisterForm";

export default function RegisterPageIntro() {
  return (
    <section className={styles.container}>
      <div className={styles.navContainer}>
        <Nav />
      </div>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.left}>
            <h1 className={styles.heading}>Create An Account</h1>
            <p className={styles.copy}>
              Let’s get started with your free account
            </p>
            <div className={styles.formContainer}>
              <RegisterForm />
            </div>
          </div>
          <div className={styles.right}>
            <Register className={styles.icon} />
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
