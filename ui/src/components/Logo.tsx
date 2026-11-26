import styles from './Logo.module.css';

/** Brand mark: a storefront with a scalloped awning. Colours come from tokens. */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className={styles.mark}>
      <rect width="40" height="40" rx="11" className={styles.markBg} />
      {/* awning */}
      <path d="M9 13.5 11.2 9h17.6l2.2 4.5H9Z" className={styles.markFg} />
      <path
        d="M9 13.5h22v1.2a2.75 2.75 0 0 1-5.5 0 2.75 2.75 0 0 1-5.5 0 2.75 2.75 0 0 1-5.5 0 2.75 2.75 0 0 1-5.5 0v-1.2Z"
        className={styles.markAccent}
      />
      {/* shop front + door */}
      <path d="M11 19.5V30a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V19.5" className={styles.markStroke} />
      <rect x="17.5" y="23" width="5" height="8" rx="1" className={styles.markFg} />
    </svg>
  );
}

export function Logo() {
  return (
    <span className={styles.logo}>
      <LogoMark />
      <span className={styles.wordmark}>Storefront</span>
    </span>
  );
}
