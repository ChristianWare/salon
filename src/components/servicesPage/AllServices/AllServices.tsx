import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./AllServices.module.css";
import Image from "next/image";
import Button from "@/components/shared/Button/Button";

import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import { services } from "@/data";

export default function AllServices() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.introInfo}>
            <SectionIntro title='What we do' />
            <h2 className={styles.heading}>
              Full range of <br /> grooming services{" "}
            </h2>
          </div>
          <div className={styles.dataContainer}>
            {services.map((x) => (
              <div key={x.id} className={styles.card}>
                <div className={styles.bottomCornerContainer}>
                  <div className={styles.bottomCorner}>
                    <div className={styles.btnContainerii}>
                      <Button
                        href={`/services/${x.slug}`}
                        btnType='blue'
                        text='More details'
                        arrow
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.cardTop}>
                  <div className={styles.imgContainer}>
                    <Image
                      src={x.src}
                      alt='Hero Image'
                      fill
                      className={styles.img}
                    />
                  </div>
                </div>
                <div className={styles.cardBottom}>
                  <div className={styles.cbLeft}>
                    <h3 className={styles.title}>{x.title}</h3>
                    <p className={styles.desc}>{x.copy}</p>
                  </div>
                  <div className={styles.cbRight}>
                    <Button
                      text={x.price}
                      btnType='orange'
                      href={`/services/${x.slug}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.btnContainer}>
            <Button btnType='orange' text='See all Services' href='/' arrow />
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
