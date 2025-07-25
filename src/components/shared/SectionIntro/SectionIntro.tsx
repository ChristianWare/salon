import styles from "./SectionIntro.module.css";

interface SectionIntroProps {
  title: string;
}

export default function SectionIntro({ title }: SectionIntroProps) {
  return (
    <div className={styles.container}>
      <span className={styles.span}>{title}</span>
    </div>
  );
}
