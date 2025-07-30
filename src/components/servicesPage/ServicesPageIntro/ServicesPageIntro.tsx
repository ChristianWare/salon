import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./ServicesPageIntro.module.css";
import Nav from "@/components/shared/Nav/Nav";
import Image from "next/image";
import Img1 from "../../../../public/images/servicesIntroii.png";
import Button from "@/components/shared/Button/Button";

const data = [
  {
    id: 1,
    title: "Dog Grooming",
    price: "$50",
    description: "Professional grooming services for all dog breeds.",
  },
  {
    id: 2,
    title: "Cat Grooming",
    price: "$45",
    description: "Gentle grooming services for your feline friends.",
  },
  {
    id: 3,
    title: "Spa Treatments",
    price: "$60",
    description: "Relaxing spa treatments for your pets.",
  },
  {
    id: 4,
    title: "Nail Clipping",
    price: "$20",
    description: "Safe and quick nail clipping services.",
  },
];

export default function ServicesPageIntro() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <Nav />
        <div className={styles.content}>
          <div className={styles.top}>
            <div className={styles.left}>
              <div className={styles.leftContent}>
                <h1 className={styles.heading}>
                  Most popular <br /> grooming & spa Services
                </h1>
                {data.map((x) => (
                  <div key={x.id} className={styles.serviceCard}>
                    <div className={styles.titlePriceContainer}>
                      <div className={styles.title}>{x.title}</div>
                      <div className={styles.middleDots}></div>
                      <span className={styles.price}>{x.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.middle}>
              <div className={styles.imgContainer}>
                <Image
                  src={Img1}
                  alt='Hero Image'
                  fill
                  className={styles.img}
                />
              </div>
            </div>
            <div className={styles.right}>
              <div className={styles.copyBtnContainer}>
                <p className={styles.copy}>
                  Premium dog grooming services tailored to your furry
                  friend&#39;s unique needs. Where every dog leaves looking and
                  feeling their absolute best.
                </p>
                <div className={styles.btnContainer}>
                  <Button
                    btnType='orange'
                    text='Book a spa day'
                    href='/'
                    arrow
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
