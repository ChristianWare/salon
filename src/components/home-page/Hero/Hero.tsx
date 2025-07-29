import Nav from "@/components/shared/Nav/Nav";
import styles from "./Hero.module.css";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import Image from "next/image";
import Img1 from "../../../../public/images/hero.jpg";
import Corner from "@/components/shared/Corner/Corner";
import Button from "@/components/shared/Button/Button";

export default function Hero() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <Nav />
        <div className={styles.content}>
          <div className={styles.cornerContainer}>
            <Corner />
          </div>
          <div className={styles.top}>
            <div className={styles.imgContainer}>
              <Image src={Img1} alt='Hero Image' fill className={styles.img} />
            </div>
          </div>
          <div className={styles.bottom}>
            <h1 className={styles.heading}>
              The best way to <br />
              Pamper Your Pup
            </h1>
          </div>
          <div className={styles.bottomCornerContainer}>
            <div className={styles.bottomCorner}>
              <p className={styles.copy}>
                Premium dog grooming services tailored to your furry
                friend&#39;s unique needs. Where every dog leaves looking and
                feeling their absolute best.
              </p>
              <div className={styles.btnContainer}>
                <Button btnType='orange' text='Book a spa day' href='/' arrow />
              </div>
              <div className={styles.hero}></div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
