import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { catalogueApi } from '../../api/endpoints';
import type { ProductResponse } from '../../api/types';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { ChatIcon, MailIcon, ShieldIcon } from '../../components/Icons';
import { NotFound } from '../../components/NotFound';
import { ProductImage } from '../../components/ProductImage';
import { Rating } from '../../components/Rating';
import { ErrorState } from '../../components/States';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { categoryPath, formatCategory, formatPrice } from '../../lib/format';
import { EnquiryDrawer } from '../enquiry/EnquiryDrawer';
import styles from './ProductPage.module.css';

export function ProductPage() {
  const { id = '' } = useParams();
  // key: navigating to another product resets the enquiry state.
  return <ProductDetails key={id} id={id} />;
}

function ProductDetails({ id }: { id: string }) {
  const { data, error, loading, retry } = useApi<ProductResponse>(catalogueApi.product(id));
  const [enquiring, setEnquiring] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const product = data?.product;
  useDocumentTitle(product?.title);

  if (error?.status === 404 || error?.status === 400) {
    return <NotFound title="Product not found" message="This product may have been removed or the link is wrong." />;
  }

  return (
    <div className="container">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          ...(product ? [{ label: formatCategory(product.category), to: categoryPath(product.category) }] : []),
          { label: product?.title ?? 'Product' },
        ]}
      />

      {error && <ErrorState error={error} onRetry={retry} />}
      {loading && <ProductSkeleton />}

      {product && (
        <article className={styles.layout}>
          <div className={styles.media}>
            <ProductImage src={product.imageUrl} alt={product.title} className={styles.image} loading="eager" />
          </div>

          <div className={styles.info}>
            <Link to={categoryPath(product.category)} className={styles.category}>
              {formatCategory(product.category)}
            </Link>
            <h1 className={`display ${styles.title}`}>{product.title}</h1>
            <Rating rate={product.rating.rate} count={product.rating.count} size="md" />
            <p className={styles.price}>{formatPrice(product.price)}</p>

            <div className={styles.panel}>
              <button
                ref={triggerRef}
                type="button"
                className="btn btn-primary btn-lg btn-block"
                onClick={() => setEnquiring(true)}
                aria-haspopup="dialog"
                aria-expanded={enquiring}
              >
                <MailIcon width={20} height={20} /> Enquire about this product
              </button>
              <ul className={styles.assurances}>
                <li>
                  <ChatIcon width={18} height={18} /> Ask about availability, pricing or delivery
                </li>
                <li>
                  <MailIcon width={18} height={18} /> Our sales team replies by email
                </li>
                <li>
                  <ShieldIcon width={18} height={18} /> No account needed, details used only to reply
                </li>
              </ul>
            </div>

            <section className={styles.details} aria-labelledby="product-description">
              <h2 id="product-description" className={styles.detailsTitle}>
                Description
              </h2>
              <p className={styles.description}>{product.description}</p>
            </section>
          </div>

          {enquiring && (
            <EnquiryDrawer
              product={product}
              onClose={() => {
                setEnquiring(false);
                triggerRef.current?.focus();
              }}
            />
          )}
        </article>
      )}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className={styles.layout} aria-busy="true">
      <span className="visually-hidden">Loading product…</span>
      <div className={`${styles.media} ${styles.skeleton}`} aria-hidden="true" />
      <div className={styles.info} aria-hidden="true">
        <div className={styles.skeletonLine} style={{ width: '25%' }} />
        <div className={styles.skeletonLine} style={{ width: '90%', height: 36 }} />
        <div className={styles.skeletonLine} style={{ width: '40%' }} />
        <div className={styles.skeletonLine} style={{ width: '20%', height: 32 }} />
        <div className={styles.skeletonLine} style={{ height: 54, borderRadius: 999 }} />
      </div>
    </div>
  );
}
