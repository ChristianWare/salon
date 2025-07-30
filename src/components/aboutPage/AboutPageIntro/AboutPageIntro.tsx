import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./AboutPageIntro.module.css";
import Nav from "@/components/shared/Nav/Nav";
import Image from "next/image";
import Img1 from "../../../../public/images/servicesIntro.png";
import Img2 from "../../../../public/images/servicesIntroii.png";
import Img3 from "../../../../public/images/servicesIntroiii.png";
import Img4 from "../../../../public/images/servicesIntroiv.png";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";

export default function AboutPageIntro() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <Nav />
        <div className={styles.content}>
          <div className={styles.top}>
            <SectionIntro title='About Tailored Tails' />
            <h1 className={styles.heading}>
              our  story
            </h1>
            <p className={styles.copy}>
              From health services to grooming, and adoption, we’re here to
              support your pet’s journey every step of the way.
            </p>
          </div>
          <div className={styles.bottom}>
            <div className={styles.imgContainer}>
              <Image src={Img1} alt='Hero Image' fill className={styles.img} />
            </div>
            <div className={styles.imgContainer}>
              <Image src={Img2} alt='Hero Image' fill className={styles.img} />
            </div>
            <div className={styles.imgContainer}>
              <Image src={Img3} alt='Hero Image' fill className={styles.img} />
            </div>
            <div className={styles.imgContainer}>
              <Image src={Img4} alt='Hero Image' fill className={styles.img} />
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
