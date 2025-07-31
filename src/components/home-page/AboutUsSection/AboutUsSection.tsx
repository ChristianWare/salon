import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./AboutUsSection.module.css";
import Image from "next/image";
import Img1 from "../../../../public/images/heroii.jpg";

export default function AboutUsSection() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.top}>
            <h2 className={styles.heading}>Comfort. Quality. Muchacho</h2>
            <p className={styles.copy}>
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Nihil
              similique tenetur possimus excepturi illum quisquam deserunt
              tempore accusamus alias, fuga porro temporibus, ratione non
              laborum!
            </p>
          </div>
          <div className={styles.bottom}>
            <div className={styles.imgContainer}>
              <Image
                src={Img1}
                alt='A dog getting a haircut'
                className={styles.img}
                fill
              />
              <div className={styles.imgOverlay} />
              <div className={styles.textContainer}>
                <h3 className={styles.subHeading}>Modenern Equipment</h3>
                <p className={styles.copyii}>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga
                  nemo repellat et soluta. Aut repellendus sed facilis, saepe
                  commodi molestiae placeat aliquam dolorem ipsa, ea et ab
                  distinctio eligendi odit. Libero unde aperiam aspernatur qui!
                </p>
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
