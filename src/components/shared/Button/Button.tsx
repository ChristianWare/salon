import styles from "./Button.module.css";
import { ReactNode } from "react";
import Link from "next/link";
import Arrow from "@/components/icons/Arrow/Arrow";
import Phone from "@/components/icons/Phone/Phone";
import Plus from "@/components/icons/Plus/Plus";

interface Props {
  href: string;
  text?: string;
  btnType: string;
  target?: string;
  disabled?: boolean;
  children?: ReactNode;
  arrow?: boolean;
  plus?: boolean;
  phone?: boolean;
}

export default function Button({
  href = "",
  text,
  btnType,
  target = "",
  disabled,
  children,
  arrow,
  plus,
  phone,
}: Props) {
  const content = text || children;

  return (
    <button className={styles.container} disabled={disabled}>
      <Link
        href={href}
        className={`${styles.btn} ${styles[btnType]}`}
        target={target}
        >
        {plus && <Plus className={styles.plus} />}
        {phone && <Phone className={styles.phone} />}
        {content}
        {arrow && <Arrow className={styles.arrow} />}
      </Link>
    </button>
  );
}
