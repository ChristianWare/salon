import Nav from "@/components/shared/Nav/Nav";
import styles from "./LoginPageIntro.module.css";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import LoginSvg from "@/components/icons/LoginSvg/LoginSvg";
import LoginForm from "@/components/auth/LoginForm/LoginForm";

export default function LoginPageIntro() {
  return (
    <section className={styles.container}>
      <div className={styles.navContainer}>
        <Nav />
      </div>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.left}>
            <LoginSvg className={styles.icon} />
          </div>
          <div className={styles.right}>
            <h1 className={styles.heading}>Welcome back</h1>
            <p className={styles.copy}>
              Enter your email and password to access your account
            </p>
            <div className={styles.formContainer}>
              <LoginForm />
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
