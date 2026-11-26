import styles from './Rating.module.css';

export function Rating({ rate, count, size = 'sm' }: { rate: number; count: number; size?: 'sm' | 'md' }) {
  const percent = Math.max(0, Math.min(100, (rate / 5) * 100));
  return (
    <span
      className={`${styles.rating} ${size === 'md' ? styles.md : ''}`}
      role="img"
      aria-label={`Rated ${rate.toFixed(1)} out of 5 from ${count} reviews`}
    >
      <span className={styles.stars} aria-hidden="true">
        <span className={styles.empty}>★★★★★</span>
        <span className={styles.filled} style={{ width: `${percent}%` }}>
          ★★★★★
        </span>
      </span>
      <span className={styles.value} aria-hidden="true">
        {rate.toFixed(1)} <span className={styles.count}>({count})</span>
      </span>
    </span>
  );
}
