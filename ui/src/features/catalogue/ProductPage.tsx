import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { catalogueApi } from '../../api/endpoints';
import type { ProductResponse } from '../../api/types';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { NotFound } from '../../components/NotFound';
import { ProductImage } from '../../components/ProductImage';
import { Rating } from '../../components/Rating';
import { ErrorState } from '../../components/States';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { categoryPath, formatCategory, formatPrice } from '../../lib/format';
import { EnquiryForm } from '../enquiry/EnquiryForm';
import styles from './ProductPage.module.css';

export function ProductPage() {
  const { id = '' } = useParams();
  // key: navigating to another product resets the enquiry panel state.
  return <ProductDetails key={id} id={id} />;
}

function ProductDetails({ id }: { id: string }) {
  const { data, error, loading, retry } = useApi<ProductResponse>(catalogueApi.product(id));
  const [enquiring, setEnquiring] = useState(false);
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
            <h1 className={styles.title}>{product.title}</h1>
            <Rating rate={product.rating.rate} count={product.rating.count} size="md" />
            <p className={styles.price}>{formatPrice(product.price)}</p>
            <p className={styles.description}>{product.description}</p>

            <div className={styles.cta}>
              {enquiring ? (
                <EnquiryForm product={product} onCancel={() => setEnquiring(false)} />
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => setEnquiring(true)}
                    aria-expanded={enquiring}
                  >
                    Enquire about this product
                  </button>
                  <p className={styles.hint}>Ask about availability, pricing or delivery. No account needed.</p>
                </>
              )}
            </div>
          </div>
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
        <div className={styles.skeletonLine} style={{ width: '90%', height: 28 }} />
        <div className={styles.skeletonLine} style={{ width: '40%' }} />
        <div className={styles.skeletonLine} style={{ width: '20%', height: 28 }} />
        <div className={styles.skeletonLine} />
        <div className={styles.skeletonLine} />
      </div>
    </div>
  );
}
