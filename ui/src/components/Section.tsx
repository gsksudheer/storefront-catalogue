import type { ReactNode } from 'react';
import styles from './Section.module.css';

export function Section({
  title,
  subtitle,
  children,
  id,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  id?: string;
}) {
  const headingId = id ?? `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <header className={styles.header}>
        <h2 id={headingId} className={styles.title}>
          {title}
        </h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}
