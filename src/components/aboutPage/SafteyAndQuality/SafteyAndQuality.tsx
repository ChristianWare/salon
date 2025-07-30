import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./SafteyAndQuality.module.css";
import Image from "next/image";
import Img1 from "../../../../public/images/doggyii.jpg";
import Paw from "@/components/icons/Paw/Paw";

const data = [
  {
    id: 1,
    title: "Safety and Quality",
  },
  {
    id: 2,
    title: "Certified Groomers",
  },
  {
    id: 3,
    title: "Premium Products",
  },
  {
    id: 4,
    title: "Stress-Free Environment",
  },
  {
    id: 5,
    title: "Personalized Care",
  },
  {
    id: 6,
    title: "Modern Equipment",
  },
];

export default function SafteyAndQuality() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.imgContainer}>
              <Image
                src={Img1}
                alt='Safety and Quality'
                fill
                className={styles.img}
              />
            </div>
          </div>
          <div className={styles.right}>
            <h2 className={styles.heading}>
              ...and a proven record of <br /> safety and quality
            </h2>
            <p className={styles.copy}>
              At our salon, the safety and well-being of your pets is our top
              priority. We adhere to the highest standards of cleanliness and
              care, ensuring a safe environment for all pets. Our team is
              trained in pet first aid and CPR, and we continuously update our
              knowledge of the latest safety protocols.
            </p>
            <div className={styles.dataMap}>
              {data.map((item) => (
                <div key={item.id} className={styles.dataItem}>
                  <Paw className={styles.dataIcon} /> <span className={styles.dataTitle}>{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
