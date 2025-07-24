import styles from "./Logo.module.css";
import Link from "next/link";
import Image from "next/image";
import Img1 from "../../../../public/images/logoiii.png";

interface Props {
  size?: string;
  color?: string;
  backgroundColor?: string;
  // title: string;
  direction?: string;
}

const Logo = ({
  size = "",
  color = "",
  // title,
  backgroundColor = "",
  direction = "",
}: Props) => {
  return (
    <Link
      href='/'
      className={`${styles.logo} ${styles[size]} ${styles[color]} ${styles[backgroundColor]} ${styles[direction]}`}
    >
      <div className={styles.imgContainer}>
        <Image
          src={Img1}
          fill
          alt=''
          title=''
          className={styles.img}
          priority={true}
        />
      </div>
      {/* <div className={styles.titleContainer}>{title}</div> */}
    </Link>
  );
};

export default Logo;
