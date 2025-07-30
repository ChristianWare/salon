import Instagram from "@/components/icons/Instagram/Instagram";
import styles from "./ContactDetails.module.css";
import Facebook from "@/components/icons/Facebook/Facebook";
import LinkedIn from "@/components/icons/LinkedIn/LinkedIn";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Image from "next/image";
import Img1 from "../../../../public/images/contact.jpg";

export default function ContactDetails() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.left}>
            <SectionIntro title='How to reach us' />
            <h2 className={styles.heading}>Contact Details</h2>
            <p className={styles.copy}>You can reach us at:</p>
            <ul className={styles.list}>
              <li>Email: info@doggrooming.com</li>
              <li>Phone: (123) 456-7890</li>
            </ul>
            <div className={styles.socialsContainer}>
              <Instagram className={styles.icon} />
              <Facebook className={styles.icon} />
              <LinkedIn className={styles.icon} />
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.imgContainer}>
              <Image
                src={Img1}
                alt='Contact Details'
                title='Contact Details'
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
