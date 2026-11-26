import { Link, useSearchParams } from 'react-router';
import { catalogueApi } from '../../api/endpoints';
import type { SearchResponse } from '../../api/types';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { ProductGrid } from '../../components/ProductCard';
import { EmptyState, ErrorState, ProductGridSkeleton } from '../../components/States';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import styles from './CataloguePage.module.css';

export function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const { data, error, loading, retry } = useApi<SearchResponse>(q ? catalogueApi.search(q) : null);
  useDocumentTitle(q ? `Search: ${q}` : 'Search');

  return (
    <div className="container">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Search' }]} />
      <header className={styles.header}>
        <h1 className={styles.title}>
          {q ? (
            <>
              Results for <span className={styles.term}>“{q}”</span>
            </>
          ) : (
            'Search'
          )}
        </h1>
        {data && (
          <p className={styles.meta} aria-live="polite">
            {data.products.length} {data.products.length === 1 ? 'product' : 'products'} found
          </p>
        )}
      </header>

      {!q && <EmptyState title="What are you looking for?">Type a product name, category or keyword above.</EmptyState>}
      {loading && <ProductGridSkeleton count={4} />}
      {error && <ErrorState error={error} onRetry={retry} />}
      {data &&
        (data.products.length > 0 ? (
          <ProductGrid products={data.products} />
        ) : (
          <EmptyState title="No matching products">
            <p>
              Try a different or shorter keyword, or <Link to="/">browse the top rated products</Link>.
            </p>
          </EmptyState>
        ))}
    </div>
  );
}
