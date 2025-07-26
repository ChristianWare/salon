import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./FeaturedServices.module.css";
import Button from "@/components/shared/Button/Button";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Image from "next/image";
import Img1 from "../../../../public/images/service1.png";
import Img2 from "../../../../public/images/service2.png";
import Img3 from "../../../../public/images/service3.png";
import FalseButton from "@/components/shared/FalseButton/FalseButton";

const data = [
  {
    id: 1,
    title: "Bath  Blowout",
    price: "From $50",
  },
  {
    id: 2,
    title: "Full Grooming",
    price: "From $75",
  },
  {
    id: 3,
    title: "Spa Add-Ons",
    price: "From $125",
  },
];

export default function FeaturedServices() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.introInfo}>
            <SectionIntro title='Popular Services' />
            <h2 className={styles.heading}>
              Special Offers <br /> for your Fur baby
            </h2>
          </div>
          <div className={styles.dataContainer}>
            {data.map((x) => (
              <div key={x.id} className={styles.card}>
                <div className={styles.bottomCornerContainer}>
                  <div className={styles.bottomCorner}>
                    <div className={styles.btnContainerii}>
                      <Button
                        href='/'
                        btnType='blue'
                        text='More details'
                        arrow
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.cardTop}>
                  <Image
                    src={x.id === 1 ? Img1 : x.id === 2 ? Img2 : Img3}
                    alt={x.title}
                    width={200}
                    height={200}
                    className={styles.img}
                  />
                </div>
                <div className={styles.cardBottom}>
                  <div className={styles.cbLeft}>
                    <h3 className={styles.title}>{x.title}</h3>
                    <p className={styles.desc}>
                      Lorem ipsum dolor sit amet consectetur adipisicing elit.
                      Sunt, eius? Numquam adipisci harum unde. Ab!
                    </p>
                  </div>
                  <div className={styles.cbRight}>
                    <FalseButton text={x.price} btnType='orange' />
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
