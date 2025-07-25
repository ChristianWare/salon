import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./Experts.module.css";
import Image from "next/image";
import Im1 from "../../../../public/images/person.jpg";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Button from "@/components/shared/Button/Button";
import FalseButton from "@/components/shared/FalseButton/FalseButton";

const data = [
  {
    name: "John Doe",
    title: "Senior Expert",
    description: "John has over 10 years of experience in the industry.",
    src: Im1,
  },
  {
    name: "Jane Smith",
    title: "Lead Specialist",
    description: "Jane specializes in advanced techniques and methodologies.",
    src: Im1,
  },
  {
    name: "Alice Johnson",
    title: "Technical Advisor",
    description: "Alice provides technical guidance and support.",
    src: Im1,
  },
  {
    name: "Bob Brown",
    title: "Research Analyst",
    description: "Bob conducts research to improve our services.",
    src: Im1,
  },
  {
    name: "Charlie White",
    title: "Customer Relations",
    description: "Charlie ensures customer satisfaction and engagement.",
    src: Im1,
  },
];

export default function Experts() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.left}>
            <SectionIntro title='Advantages' />
            <h2 className={styles.heading}>Meet our experts</h2>
          </div>
          <div className={styles.right}>
            {data.map((x) => (
              <div className={styles.card} key={x.title}>
                <div className={styles.cardLeftTop}>
                  <div className={styles.imageWrapper}>
                    <Image
                      src={x.src}
                      alt={x.name}
                      className={styles.image}
                      width={150}
                      height={150}
                    />
                  </div>
                  <div className={styles.box}>
                    <div className={styles.b1}>
                      <h3 className={styles.name}>{x.name}</h3>
                      <p className={styles.title}>{x.title}</p>
                      <p className={styles.description}>{x.description}</p>
                    </div>
                    <div className={styles.b2}>
                      <Button
                        btnType='noBackgroundText'
                        href='/'
                        text='More details'
                        arrow
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.cardRight}>
                  <FalseButton text='Book now' btnType='orange' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
