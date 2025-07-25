"use client";

import { useState, useRef } from "react";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Pause from "@/components/icons/Pause/Pause";
import Play from "@/components/icons/Play/Play";
import styles from "./ValueProposition.module.css";

const data = [
  {
    id: 1,
    title: "Certified Canine Stylists",
    description:
      "Our groomers complete 600+ hours of safety & styling training.",
  },
  { id: "Muchacho", title: "", description: "", video: "/videos/pawtrim.mp4" },
  {
    id: 2,
    title: "Transparent Pricing",
    description:
      "See every service fee up-front—no surprise add-ons at pickup.",
  },
  {
    id: 3,
    title: "Text Updates",
    description:
      "Receive “in the tub”, “ready for pickup”, and photo-finished alerts.",
  },
  {
    id: 4,
    title: "Quality Service",
    description:
      "We provide top-notch services to ensure customer satisfaction.",
  },
];

export default function ValueProposition() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.left}>
            <SectionIntro title='Why dog parents love Muchacho' />
          </div>
          <div className={styles.right}>
            {data.map((x) => (
              <div
                key={x.id}
                className={`${styles.card} ${x.video ? styles.videoCard : ""}`}
              >
                {x.video && (
                  <>
                    <video
                      ref={videoRef}
                      preload='auto'
                      muted
                      loop
                      className={styles.video}
                    >
                      <source src={x.video} type='video/mp4' />
                    </video>
                    <div className={styles.imgOverlay} />
                    <button
                      type='button'
                      onClick={togglePlay}
                      className={styles.playPauseBtn}
                    >
                      {isPlaying ? (
                        <Pause className={styles.icon} />
                      ) : (
                        <Play className={styles.icon} />
                      )}
                    </button>
                  </>
                )}
                <span className={styles.id}>{x.id}</span>
                <div className={styles.titleDescriptionContiner}>
                    <span className={styles.title}>{x.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
