import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./HowItWorks.module.css";
import Image from "next/image";
import Img1 from "../../../../public/images/service2.png";

const data = [
  {
    id: 1,
    title: "Choose a groomer & time",
  },
  {
    id: 2,
    title: "Select services + tip",
  },
  {
    id: 3,
    title: "Drop off, relax, and pick up a fresh pup",
  },
];

export default function HowItWorks() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.container}>
          <div className={styles.top}>
            <h2 className={styles.heading}>How it works</h2>
            <p className={styles.copy}>
              Lorem ipsum, dolor sit amet consectetur adipisicing elit.
              Recusandae sint exercitationem velit consequuntur ad unde est
              nesciunt architecto assumenda. Labore!
            </p>
          </div>
          <div className={styles.bottom}>
            <div className={styles.bottomLeft}>
              {data.map((x) => (
                <div className={styles.card} key={x.id}>
                  <h3 className={styles.title}>{x.title}</h3>
                  <p className={styles.desc}>Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui dolorum, ea quidem nihil optio nesciunt.</p>
                </div>
              ))}
            </div>
            <div className={styles.bottomRight}>
              <div className={styles.imgContainer}>
                <Image src={Img1} fill alt='' title='' className={styles.img} />
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
