import styles from "./Corner.module.css";

interface Props {
  backgroundColor?: string;
  direction?: string;
}

export default function Corner({
  backgroundColor = "",
  direction = "",
}: Props) {
  return (
    <div
      className={`${styles.container} ${styles[backgroundColor]} ${styles[direction]}`}
    >
      <div className={styles.svgContainer}>
        <svg
          viewBox='0 0 16 16'
          preserveAspectRatio='none'
          className={styles.svgNotch}
        >
          <use href='#svg-815591482_180' />
        </svg>
        
      </div>
    </div>
  );
}
