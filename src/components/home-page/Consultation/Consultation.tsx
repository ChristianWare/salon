import LayoutWrapper from "@/components/shared/LayoutWrapper";
import styles from "./Consultation.module.css";
import Image from "next/image";
import Img1 from "../../../../public/images/consultation.jpg";
import Message from "@/components/icons/Message/Message";
import FalseButton from "@/components/shared/FalseButton/FalseButton";
import Corner from "@/components/shared/Corner/Corner";

export default function Consultation() {
  return (
    <div className={styles.parent}>
      <section className={styles.container}>
        <div className={styles.cornerContainer}>
          <Corner backgroundColor='backgroundColorWhite' />
        </div>
        <div className={styles.imgOverlay} />
        <Image src={Img1} fill alt='' title='' className={styles.img} />
        <LayoutWrapper>
          <div className={styles.content}>
            <div className={styles.formmBox}>
              <div className={styles.headingIconContainer}>
                <h2 className={styles.heading}>Get a free consultation</h2>
                <div className={styles.iconContainer}>
                  <Message className={styles.icon} />
                </div>
              </div>
              <p className={styles.copy}>
                Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nulla
                sunt voluptas reiciendis hic animi aliquam sequi provident,
                tenetur neque amet! Autem quo animi tenetur error aut aliquam
                cum omnis vitae.
              </p>
              <div className={styles.fakeForm}>
                <div className={styles.input}>Name</div>
                <div className={styles.input}>Email</div>
              </div>
              <div className={styles.disclosure}>
                Lorem ipsum dolor sit amet consectetur.
              </div>
              <div className={styles.btnContainer}>
                <FalseButton btnType='orange' text='Submit' />
              </div>
            </div>
          </div>
        </LayoutWrapper>
      </section>
    </div>
  );
}
