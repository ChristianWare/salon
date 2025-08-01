import styles from "./AdminKpiCard.module.css";

export default function AdminKpiCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className={styles.container}>
      <p>{label}</p>
      <p>{value}</p>
    </div>
  );
}
