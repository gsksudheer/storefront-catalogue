import { useState } from 'react';
import styles from './ProductImage.module.css';

/** Product image with a neat placeholder if the remote image fails to load. */
export function ProductImage({
  src,
  alt,
  className,
  loading = 'lazy',
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`${styles.placeholder} ${className ?? ''}`} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
          <path
            fill="currentColor"
            d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm2 0v9.6l3.3-3.3a1 1 0 0 1 1.4 0l3.3 3.3 1.3-1.3a1 1 0 0 1 1.4 0L18 14.6V5H6Zm9 4.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
          />
        </svg>
        <span>Image unavailable</span>
      </div>
    );
  }
  return <img src={src} alt={alt} loading={loading} className={className} onError={() => setFailed(true)} />;
}
