'use client'

import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./ServicesDetailPageIntro.module.css";
import Nav from "@/components/shared/Nav/Nav";
import Corner from "@/components/shared/Corner/Corner";
import Image from "next/image";
import { services } from "@/data";

type Service = (typeof services)[number];



export default function ServicesDetailPageIntro({ service }: { service: Service }) {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <Nav />
        <div className={styles.content}>
          <div className={styles.top}>
            <div className={styles.imgContainer}>
              <div className={styles.cornerContainer}>
                <Corner backgroundColor='backgroundColorGray' />
              </div>
              <Image
                src={service.src}
                alt='Hero Image'
                fill
                className={styles.img}
              />
              <div className={styles.imgOverlay} />
              <h1 className={styles.heading}>
                {service.title}
              </h1>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
