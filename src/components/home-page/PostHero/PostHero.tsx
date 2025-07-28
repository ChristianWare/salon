import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./PostHero.module.css";
import Image from "next/image";
import Img1 from "../../../../public/images/heroiii.jpg";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Button from "@/components/shared/Button/Button";

export default function PostHero() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.rightTop}>
              <SectionIntro title='Why pet parents choose us' />
              <h4 className={styles.subHeading}>
                We go above and beyond to ensure your dog has the best possible
                experience.
              </h4>
              <p className={styles.copy}>
                Our team is dedicated to providing personalized care and
                attention to each and every pet.
              </p>
              <div className={styles.btnContainer}>
                <Button btnType='orange' href='/' text='Learn More' arrow />
              </div>
              <small>Book a call with our tem</small>
            </div>
            <div className={styles.rightBottom}>
              <p className={styles.rightBottomCopy}>
                All our groomers are certified professionals with extensive
                training in dog handling and grooming techniques. Our salon is
                designed to minimize anxiety with calming music, aromatherapy,
                and gentle handling techniques. We use only high-quality,
                pet-safe shampoos and products suitable for sensitive skin and
                various coat types.
              </p>
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.imgContainer}>
              <Image
                src={Img1}
                alt='Hero Image'
                title=''
                fill
                className={styles.img}
              />
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
