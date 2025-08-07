import { ReactNode } from "react";
import styles from "./FalseButton.module.css";
import Arrow from "@/components/icons/Arrow/Arrow";

interface FalseButtonProps {
  text?: string;
  btnType?: "primary" | "secondary" | string;
  children?: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "submit" | "reset" | "button" | undefined;
  disabled?: boolean;
  arrow?: boolean;
}

export default function FalseButton({
  text,
  btnType = "primary",
  children,
  arrow,
  onClick,
  type,
  disabled,
}: FalseButtonProps) {
  const content = text ?? children;

  return (
    <button
      className={styles.container}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      <div className={`${styles.btn} ${styles[btnType]}`}>
        {content} {arrow && <Arrow className={styles.arrow} />}
      </div>
    </button>
  );
}
