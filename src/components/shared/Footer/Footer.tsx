import Button from "../Button/Button";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <h2 className={styles.heading}>Pamper Your Pooch at Tailored Tails</h2>
        <div className={styles.topCopyBtnContainer}>
          <p className={styles.copy}>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ad quae
            consequuntur repudiandae adipisci. Ea voluptatibus atque dicta
            incidunt praesentium assumenda aut.
          </p>
          <div className={styles.btnContainer}>
            <Button btnType='orange' href='' text='Book a consultation' arrow />
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <footer className={styles.container}>
          <div className={styles.footerLeft}></div>
          <div className={styles.footerRight}></div>
        </footer>
      </div>
    </div>
  );
}
