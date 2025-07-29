import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./AllServices.module.css";
import Image from "next/image";
import FalseButton from "@/components/shared/FalseButton/FalseButton";
import Button from "@/components/shared/Button/Button";
import Img1 from "../../../../public/images/blowout.jpg";
import Img2 from "../../../../public/images/groom.jpg";
import Img3 from "../../../../public/images/spa.jpg";
import Nail from "../../../../public/images/nail.jpg";
import Ear from "../../../../public/images/ear.jpg";
import Teeth from "../../../../public/images/teeth.jpg";
import Flea from "../../../../public/images/flea.jpg";
import Deshedding from "../../../../public/images/deshedding.jpg";
import Cut from "../../../../public/images/cut.jpg";
import Massage from "../../../../public/images/massage.jpg";
import Hydrotherapy from "../../../../public/images/water.jpg";
import Old from "../../../../public/images/old.jpg";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";

const data = [
  {
    id: 1,
    title: "Bath  Blowout",
    price: "From $50",
    description: "A refreshing bath and blowout for your pet.",
    src: Img1,
  },
  {
    id: 2,
    title: "Full Grooming",
    price: "From $75",
    description: "Complete grooming service including bath, cut, and styling.",
    src: Img2,
  },
  {
    id: 3,
    title: "Spa Add-Ons",
    price: "From $125",
    description: "Pamper your pet with our luxurious spa add-ons.",
    src: Img3,
  },
  {
    id: 4,
    title: "Nail Trimming",
    price: "From $20",
    src: Nail,
  },
  {
    id: 5,
    title: "Ear Cleaning",
    price: "From $15",
    description: "Keep your pet's ears clean and free of debris.",
    src: Ear,
  },
  {
    id: 6,
    title: "Teeth Brushing",
    price: "From $30",
    description:
      "Maintain your pet's dental hygiene with our teeth brushing service.",
    src: Teeth,
  },
  {
    id: 7,
    title: "Flea Treatment",
    price: "From $40",
    description: "Effective flea treatment to keep your pet comfortable.",
    src: Flea,
  },
  {
    id: 8,
    title: "De-shedding",
    price: "From $60",
    desscription: "Reduce shedding with our specialized de-shedding service.",
    src: Deshedding,
  },
  {
    id: 9,
    title: "Specialty Cuts",
    price: "From $80",
    description: "Custom grooming cuts tailored to your pet's needs.",
    src: Cut,
  },
  {
    id: 10,
    title: "Pet Massage",
    price: "From $70",
    description: "Relax your pet with a soothing massage.",
    src: Massage,
  },
  {
    id: 11,
    title: "Hydrotherapy",
    price: "From $90",
    description:
      "Therapeutic water treatment for your pet's joints and muscles.",
    src: Hydrotherapy,
  },
  {
    id: 12,
    title: "Senior Pet Care",
    price: "From $100",
    description:
      "Specialized care for older pets to ensure their comfort and well-being.",
    src: Old,
  },
];

export default function AllServices() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.introInfo}>
            <SectionIntro title='All Services' />
            {/* <h2 className={styles.heading}>
              Special Offers <br /> for your Fur baby
            </h2> */}
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
                  {/* <Image
                    src={x.id === 1 ? Img1 : x.id === 2 ? Img2 : Img3}
                    alt={x.title}
                    width={200}
                    height={200}
                    className={styles.img}
                  /> */}
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
                    <p className={styles.desc}>
                      {x.description || "No description available."}
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
