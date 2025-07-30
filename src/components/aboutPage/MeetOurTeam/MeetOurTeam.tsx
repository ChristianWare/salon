import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./MeetOurTeam.module.css";
import Image from "next/image";
import Img1 from "../../../../public/images/doggy.jpg";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Button from "@/components/shared/Button/Button";

const data = [
  {
    id: 1,
    title: "Years of Experience",
    value: "10+",
  },
  {
    id: 2,
    title: "Treats Given",
    value: "1000+",
  },
  {
    id: 3,
    title: "Happy Clients",
    value: "500+",
  },
  {
    id: 4,
    title: "Grooming Sessions",
    value: "2000+",
  },
];

export default function MeetOurTeam() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.top}>
          <div className={styles.imgContainer}>
            <Image
              src={Img1}
              alt='A dog getting a haircut'
              className={styles.img}
              fill
            />
            <div className={styles.imgOverlay} />

            <div className={styles.textContainer}>
              <SectionIntro title='Meet Our Team' />
              <h3 className={styles.subHeading}>
                A dedicated group <br /> of caring individuals...
              </h3>
              <p className={styles.copy}>
                Our team is made up of passionate pet lovers who are dedicated
                to providing the best care for your furry friends. With years of
                experience and a genuine love for animals, we ensure that every
                pet receives the attention and affection they deserve.
              </p>
            </div>
          </div>
        </div>
        <div className={styles.middle}>
          <h4 className={styles.headingiii}>
            ...with decades of experience...
          </h4>
          <div className={styles.middleRight}>
            <p className={styles.copyiii}>
              Our team brings a wealth of knowledge and expertise to every
              grooming session, ensuring that your pet is in the best hands
              possible. We continually update our skills to stay current with
              the latest grooming techniques and pet care standards. Each member
              of our staff is committed to creating a safe, comfortable, and
              enjoyable environment for every pet. We take pride in building
              lasting relationships with both pets and their owners, making
              every visit a positive experience.
            </p>
            <div className={styles.btnContainer}>
              <Button text='Learn More' href='/services' btnType='orange' />
            </div>
          </div>
        </div>
        <div className={styles.bottom}>
          <div className={styles.mapData}>
            {data.map((item) => (
              <div key={item.id} className={styles.item}>
                <span className={styles.itemTitle}>{item.title}</span>
                <h4 className={styles.itemValue}>{item.value}</h4>
              </div>
            ))}
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
