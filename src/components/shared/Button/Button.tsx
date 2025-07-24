import { ReactNode } from "react";
import Link from "next/link";
import styles from "./Button.module.css";
import Arrow from "@/components/icons/Arrow/Arrow";
import Image from "next/image";
import ChrisImg from "../../../../public/images/chris.jpg";

interface Props {
  href: string;
  text?: string;
  btnType: string;
  target?: string;
  disabled?: boolean;
  children?: ReactNode;
  arrow?: boolean;
  image?: boolean;
}

export default function Button({
  href = "",
  text,
  btnType,
  target = "",
  disabled,
  children,
  arrow,
  image,
}: Props) {
  const content = text || children;

  return (
    <button className={styles.container} disabled={disabled}>
      <Link
        href={href}
        className={`${styles.btn} ${styles[btnType]}`}
        target={target}
      >
        {image && (
          <div className={styles.imgContainer}>
            <Image src={ChrisImg} alt='' fill className={styles.img} />
          </div>
        )}
        {content}
        {arrow && <Arrow className={styles.arrow} />}
      </Link>
    </button>
  );
}
