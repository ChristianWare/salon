"use client";

import { useState } from "react";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./Reviews.module.css";
import Image from "next/image";
import Img from "../../../../public/images/charlie.jpg";
import Img2 from "../../../../public/images/bob.jpg";
import Img3 from "../../../../public/images/alice.jpg";
import Img4 from "../../../../public/images/person.jpg";
import Left from "@/components/icons/Left/Left";
import Right from "@/components/icons/Right/Right";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";

const data = [
  {
    id: 1,
    title: "Our gift to you",
    name: "Charlie P.",
    copy: "Absolutely loved my experience! The staff was friendly and professional, and I left feeling refreshed and pampered. Highly recommend to anyone looking for quality service.",
    src: Img,
  },
  {
    id: 2,
    title: "Our gift to you",
    name: "Chris N.",
    copy: "A wonderful salon with a relaxing atmosphere. The stylists really listened to what I wanted and delivered beyond my expectations. Will definitely be coming back!",
    src: Img2,
  },
  {
    id: 3,
    title: "Our gift to you",
    name: "Alice M.",
    copy: "From the moment I walked in, I felt welcomed and cared for. The attention to detail and customer service was top-notch. My hair has never looked better!",
    src: Img3,
  },
  {
    id: 4,
    title: "Our gift to you",
    name: "Bob S.",
    copy: "Great experience every time I visit. The team is talented and always makes sure I leave happy with my look. Highly recommended for anyone in the area.",
    src: Img4,
  },
];

export default function Reviews() {
  // State to track the current review index
  const [currentIndex, setCurrentIndex] = useState(0);

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? data.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === data.length - 1 ? 0 : prevIndex + 1
    );
  };

  const currentReview = data[currentIndex];

  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.contentTop}>
          <div className={styles.left}>
            <SectionIntro title='Reviews' />
          </div>
          <div className={styles.right}>
            <div className={styles.rightTop}>
              <h2 className={styles.heading}>What people say:</h2>
            </div>
            <div className={styles.rightBottom}>
              <div className={styles.carouselContainer}>
                {/* Current review */}
                <div className={styles.card}>
                  <div className={styles.cardLeft}>
                    <span className={styles.name}>{currentReview.name}</span>
                    <p className={styles.copy}>{currentReview.copy}</p>
                  </div>
                  <div className={styles.cardRight}>
                    <div className={styles.imgContainer}>
                      <Image
                        src={currentReview.src}
                        alt=''
                        title=''
                        fill
                        className={styles.img}
                      />
                    </div>
                    <div className={styles.indicators}>
                      {data.map((_, index) => (
                        <span
                          key={index}
                          className={`${styles.indicator} ${
                            index === currentIndex ? styles.activeIndicator : ""
                          }`}
                          aria-label={
                            index === currentIndex
                              ? "Current review"
                              : `Go to review ${index + 1}`
                          }
                          onClick={() => setCurrentIndex(index)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.navigation}>
                  <div className={styles.arrowBoxParent}>
                    <div className={styles.arrowBox}>
                      <Left
                        className={styles.icon}
                        onClick={goToPrevious}
                        aria-label='Previous review'
                      />
                    </div>
                    <div className={styles.arrowBox}>
                      <Right
                        onClick={goToNext}
                        className={styles.icon}
                        aria-label='Next review'
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
