import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { catalogueApi } from '../../api/endpoints';
import type { Product, SearchResponse } from '../../api/types';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { ProductGrid } from '../../components/ProductCard';
import { EmptyState, ErrorState, ProductGridSkeleton } from '../../components/States';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatCategory } from '../../lib/format';
import styles from './CataloguePage.module.css';

export function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const { data, error, loading, retry } = useApi<SearchResponse>(q ? catalogueApi.search(q) : null);
  useDocumentTitle(q ? `Search: ${q}` : 'Search');

  return (
    <div className="container">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Search' }]} />
      <header className={styles.banner}>
        <p className="eyebrow">Search</p>
        <h1 className={`display ${styles.title}`}>
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

      {!q && (
        <EmptyState title="What are you looking for?">Type a product name, category or keyword in the search bar.</EmptyState>
      )}
      {loading && <ProductGridSkeleton count={4} />}
      {error && <ErrorState error={error} onRetry={retry} />}
      {data &&
        (data.products.length > 0 ? (
          // key: a new search resets filters and sort.
          <Results key={q} products={data.products} />
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

type Sort = 'relevance' | 'price-asc' | 'price-desc' | 'rating';
const sorters: Record<Sort, ((a: Product, b: Product) => number) | null> = {
  relevance: null,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating.rate - a.rating.rate,
};

/** Client-side refinement of a result set that is already small. Server stays the source of matches. */
function Results({ products }: { products: Product[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('relevance');

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    return [...m.entries()];
  }, [products]);

  const visible = useMemo(() => {
    const filtered = category ? products.filter((p) => p.category === category) : products;
    const sorter = sorters[sort];
    return sorter ? [...filtered].sort(sorter) : filtered;
  }, [products, category, sort]);

  return (
    <>
      <div className={styles.toolbar}>
        {counts.length > 1 ? (
          <ul className={styles.chips} aria-label="Filter by category">
            <li>
              <button type="button" className={styles.chip} aria-pressed={category === null} onClick={() => setCategory(null)}>
                All <span className={styles.count}>{products.length}</span>
              </button>
            </li>
            {counts.map(([c, n]) => (
              <li key={c}>
                <button type="button" className={styles.chip} aria-pressed={category === c} onClick={() => setCategory(c)}>
                  {formatCategory(c)} <span className={styles.count}>{n}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <span />
        )}
        <label className={styles.sort}>
          Sort by
          <select className={styles.select} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="relevance">Relevance</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Highest rated</option>
          </select>
        </label>
      </div>
      <ProductGrid products={visible} />
    </>
  );
}
