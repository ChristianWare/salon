import styles from "./Logo.module.css";
import Link from "next/link";
import Tail from "@/components/icons/Tail/Tail";

interface Props {
  size?: string;
  color?: string;
  backgroundColor?: string;
  direction?: string;
}

const Logo = ({
  size = "",
  color = "",
  backgroundColor = "",
  direction = "",
}: Props) => {
  return (
    <Link
      href='/'
      className={`${styles.logo} ${styles[size]} ${styles[color]} ${styles[backgroundColor]} ${styles[direction]}`}
    >
      {/* Dog Salon */}
      <Tail className={styles.tailOne} />
      Taylored Tails <Tail className={styles.tailTwo} />
    </Link>
  );
};

export default Logo;
