import Image from "next/image";
import LayoutWrapper from "../LayoutWrapper";
import styles from "./FinalCTA.module.css";
import Img1 from "../../../../public/images/hero.jpg";
import Button from "../Button/Button";

export default function FinalCTA() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.imgContainer}>
            <Image src={Img1} alt='Hero Image' fill className={styles.img} />
          </div>
          <h2 className={styles.heading}>Ready for a Shed-Free Sofa?</h2>
          <p className={styles.copy}>
            Book your appointment today and experience the best in beauty and
            wellness.
          </p>
          <div className={styles.btnContainer}>
            <Button btnType='orange' text='Book Now' href='/' arrow />
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
