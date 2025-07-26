import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./HowItWorks.module.css";
import Image from "next/image";
import Img1 from "../../../../public/images/heroiii.jpg";
import FalseButton from "@/components/shared/FalseButton/FalseButton";

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
  { id: 4, title: "Enjoy your time with your pet" },
];

export default function HowItWorks() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.container}>
          <div className={styles.top}>
            <h2 className={styles.heading}>
              How it works <br /> in 4 easy steps
            </h2>
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
                  <h3 className={styles.title}>
                    {x.id}. {x.title}
                  </h3>
                  <p className={styles.desc}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui
                    dolorum, ea quidem nihil optio nesciunt.
                  </p>
                </div>
              ))}
              <div className={styles.btnContainer}>
                <FalseButton text='Book Now' btnType='orange' />
              </div>
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
