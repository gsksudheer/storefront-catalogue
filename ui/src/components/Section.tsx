import type { ReactNode } from 'react';
import styles from './Section.module.css';

export function Section({
  title,
  eyebrow,
  subtitle,
  action,
  children,
  id,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  const headingId = `${id ?? 'section'}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section className={styles.section} aria-labelledby={headingId} id={id}>
      <header className={styles.header}>
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 id={headingId} className={`display ${styles.title}`}>
            {title}
          </h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
