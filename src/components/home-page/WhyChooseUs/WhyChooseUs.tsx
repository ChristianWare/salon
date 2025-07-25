import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./WhyChooseUs.module.css";
import Check from "@/components/icons/Check/Check";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Star from "@/components/icons/Star/Star";

const data = [
  {
    id: 1,
    title: "Experienced Professionals",
    description:
      "Our team consists of highly skilled and experienced professionals dedicated to providing top-notch services",
    summary: "Expert Team",
  },
  {
    id: 2,
    title: "Quality Products",
    description:
      "We use only the best products to ensure that you receive the highest quality treatments and services.",
    summary: "Premium Products",
  },
  {
    id: 3,
    title: "Customer Satisfaction",
    description:
      "Your satisfaction is our priority. We strive to exceed your expectations with every visit.",
    summary: "Satisfaction",
  },
  {
    id: 4,
    title: "Relaxing Environment",
    description:
      "Enjoy a serene and relaxing atmosphere designed to make your experience as enjoyable as possible.",
    summary: "Relaxing Ambience",
  },
  {
    id: 5,
    title: "Affordable Prices",
    description:
      "We offer competitive pricing without compromising on quality, making luxury accessible to everyone.",
    summary: "Affordable Luxury",
  },
  {
    id: 6,
    title: "Convenient Location",
    description:
      "Located in the heart of the city, we are easily accessible for all your beauty needs.",
    summary: "Accessibility",
  },
  {
    id: 7,
    title: "Wide Range of Services",
    description:
      "From haircuts to facials, we offer a comprehensive range of services to cater to all your beauty needs.",
    summary: "Service Variety",
  },
];

export default function WhyChooseUs() {
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        <div className={styles.content}>
          <div className={styles.left}>
            <SectionIntro title='Advantages' />
          </div>
          <div className={styles.right}>
            <div className={styles.rightTop}>
              <h2 className={styles.heading}>Why choose us?</h2>
            </div>
            <div className={styles.rightBottom}>
              <ul className={styles.list}>
                {data.map((item) => (
                  <li key={item.id} className={styles.listItem}>
                    <Check className={styles.checkIcon} />
                    <div className={styles.itemContent}>
                      <h3 className={styles.itemTitle}>{item.title}</h3>
                      <p className={styles.itemDescription}>
                        {item.description}
                      </p>
                    </div>
                    <span className={styles.summary}>
                      {item.summary} <Star className={styles.checkIcon} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </section>
  );
}
