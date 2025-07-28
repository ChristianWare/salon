import Logo from "../Logo/Logo";
import Button from "../Button/Button";
import styles from "./Footer.module.css";
import SectionIntro from "../SectionIntro/SectionIntro";
import Instagram from "@/components/icons/Instagram/Instagram";
import Facebook from "@/components/icons/Facebook/Facebook";
import LinkedIn from "@/components/icons/LinkedIn/LinkedIn";

const data = [
  {
    id: 1,
    title: "Our Services",
    links: [
      { id: 1.1, text: "Dog Grooming" },
      { id: 1.2, text: "Dog Training" },
      { id: 1.3, text: "Dog Walking" },
    ],
  },
  {
    id: 2,
    title: "About Us",
    links: [
      { id: 2.1, text: "Our Story" },
      { id: 2.2, text: "Meet the Team" },
      { id: 2.3, text: "Testimonials" },
    ],
  },
  {
    id: 3,
    title: "Contact",
    links: [
      { id: 3.1, text: "Get in Touch" },
      { id: 3.2, text: "FAQs" },
      { id: 3.3, text: "Support" },
    ],
  },
  {
    id: 4,
    title: "Follow Us",
    links: [
      { id: 4.1, text: "Facebook" },
      { id: 4.2, text: "Instagram" },
      { id: 4.3, text: "Twitter" },
    ],
  },
];

export default function Footer() {
  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <h2 className={styles.heading}>Pamper Your Pooch at Tailored Tails</h2>
        <div className={styles.topCopyBtnContainer}>
          <p className={styles.copy}>
            Providing premium dog grooming services with love and expertise
            since 2015. We&#39;re dedicated to making your furry friend look and
            feel their best.
          </p>
          <div className={styles.btnContainer}>
            <Button btnType='orange' href='' text='Book a consultation' arrow />
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <footer className={styles.footerContainer}>
          <div className={styles.footerLeft}>
            <Logo />
            <SectionIntro title='Online Now' />
            <div className={styles.workingHoursBox}>
              <span className={styles.workingHoursTitle}>Working Hours</span>
              <ul className={styles.workingHoursList}>
                <li>Monday - Friday: 9:00 AM - 6:00 PM</li>
                <li>Saturday: 10:00 AM - 4:00 PM</li>
                <li>Sunday: Closed</li>
              </ul>
              <div className={styles.btnContainer2}>
                <Button btnType='white' href='' text='Get directions' arrow />
              </div>
              <div className={styles.socialsContainer}>
                <Instagram className={styles.icon} />
                <Facebook className={styles.icon} />
                <LinkedIn className={styles.icon} />
              </div>
            </div>
          </div>
          <div className={styles.footerRight}>
            <div className={styles.footerRightTop}>
              {data.map((x) => (
                <div key={x.id} className={styles.section}>
                  <h3 className={styles.sectionTitle}>{x.title}</h3>
                  <ul className={styles.linksList}>
                    {x.links.map((link) => (
                      <li key={link.id} className={styles.linkItem}>
                        {link.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className={styles.footerRightBottom}>
              <h3 className={styles.headingiii}>Join us</h3>
              <small className={styles.small}>
                Lorem ipsum dolor sit amet consectetur, adipisicing elit.
              </small>
              <div className={styles.fakeInput}>E-mail address</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
