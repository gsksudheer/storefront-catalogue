import type { ReactNode } from 'react';
import type { ApiError } from '../api/client';
import styles from './States.module.css';

export function ProductGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className={styles.skeletonGrid} aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Loading products…</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.skeletonCard} aria-hidden="true">
          <div className={`${styles.shimmer} ${styles.skeletonImage}`} />
          <div className={styles.skeletonBody}>
            <div className={`${styles.shimmer} ${styles.line}`} style={{ width: '40%' }} />
            <div className={`${styles.shimmer} ${styles.line}`} />
            <div className={`${styles.shimmer} ${styles.line}`} style={{ width: '70%' }} />
            <div className={`${styles.shimmer} ${styles.line}`} style={{ width: '30%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div className={styles.panel} role="alert">
      <div className={`${styles.iconCircle} ${styles.iconError}`} aria-hidden="true">
        !
      </div>
      <h2 className={styles.title}>We couldn't load this</h2>
      <p className={styles.text}>{error.message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children, icon = '?' }: { title: string; children?: ReactNode; icon?: string }) {
  return (
    <div className={styles.panel}>
      <div className={styles.iconCircle} aria-hidden="true">
        {icon}
      </div>
      <h2 className={styles.title}>{title}</h2>
      {children && <div className={styles.text}>{children}</div>}
    </div>
  );
}
