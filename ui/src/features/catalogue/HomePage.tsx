import { Link } from 'react-router';
import { catalogueApi } from '../../api/endpoints';
import type { CategoriesResponse, ProductsResponse } from '../../api/types';
import { ProductGrid } from '../../components/ProductCard';
import { Section } from '../../components/Section';
import { EmptyState, ErrorState, ProductGridSkeleton } from '../../components/States';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { categoryPath, formatCategory } from '../../lib/format';
import styles from './HomePage.module.css';

export function HomePage() {
  useDocumentTitle();
  const featured = useApi<ProductsResponse>(catalogueApi.featured());
  const categories = useApi<CategoriesResponse>(catalogueApi.categories());

  return (
    <div className="container">
      <section className={styles.hero}>
        <p className={styles.eyebrow}>New season, hand-picked</p>
        <h1 className={styles.heroTitle}>Find something you'll love</h1>
        <p className={styles.heroText}>
          Browse our catalogue, compare the details, and send us an enquiry. We'll get back to you personally.
        </p>
      </section>

      <Section title="Top rated" subtitle="Our favourite picks, chosen by the team.">
        {featured.loading && <ProductGridSkeleton count={5} />}
        {featured.error && <ErrorState error={featured.error} onRetry={featured.retry} />}
        {featured.data &&
          (featured.data.products.length > 0 ? (
            <ProductGrid products={featured.data.products} badge="Top rated" />
          ) : (
            <EmptyState title="No featured products yet" />
          ))}
      </Section>

      {categories.data && categories.data.categories.length > 0 && (
        <Section title="Shop by category">
          <ul className={styles.categories}>
            {categories.data.categories.map((c) => (
              <li key={c}>
                <Link to={categoryPath(c)} className={styles.categoryCard}>
                  <span>{formatCategory(c)}</span>
                  <span className={styles.arrow} aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
