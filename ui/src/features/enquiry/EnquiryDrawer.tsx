import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Product } from '../../api/types';
import { CloseIcon } from '../../components/Icons';
import { ProductImage } from '../../components/ProductImage';
import { formatPrice } from '../../lib/format';
import { EnquiryForm } from './EnquiryForm';
import styles from './EnquiryDrawer.module.css';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), textarea, select, [tabindex="0"]';

/**
 * Accessible side panel (bottom sheet on phones) hosting the enquiry form:
 * modal semantics, focus trap, Escape / backdrop to close (not while sending), body scroll lock.
 */
export function EnquiryDrawer({ product, onClose }: { product: Product; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const close = () => {
    if (!busy) onClose();
  };

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    } else if (e.key === 'Tab' && panelRef.current) {
      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }

  return createPortal(
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
      >
        <header className={styles.header}>
          <div>
            <p className="eyebrow">Enquiry</p>
            <h2 id={titleId} className={`display ${styles.title}`}>
              Send an enquiry
            </h2>
          </div>
          <button type="button" className="icon-btn" onClick={close} aria-label="Close" disabled={busy}>
            <CloseIcon />
          </button>
        </header>

        <div className={styles.product}>
          <span className={styles.thumb}>
            <ProductImage src={product.imageUrl} alt="" />
          </span>
          <div className={styles.productText}>
            <p className={styles.productTitle}>{product.title}</p>
            <p className={styles.productPrice}>{formatPrice(product.price)}</p>
          </div>
        </div>

        <div className={styles.body}>
          <EnquiryForm product={product} onDone={onClose} onBusyChange={setBusy} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
