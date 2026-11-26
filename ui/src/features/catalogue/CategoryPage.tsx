import { useParams } from 'react-router';
import { catalogueApi } from '../../api/endpoints';
import type { CategoryResponse } from '../../api/types';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { NotFound } from '../../components/NotFound';
import { ProductGrid } from '../../components/ProductCard';
import { Section } from '../../components/Section';
import { ErrorState, ProductGridSkeleton } from '../../components/States';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatCategory } from '../../lib/format';
import styles from './CataloguePage.module.css';

export function CategoryPage() {
  const { name = '' } = useParams();
  const { data, error, loading, retry } = useApi<CategoryResponse>(catalogueApi.category(name));
  const label = formatCategory(data?.category ?? name);
  useDocumentTitle(label);

  if (error?.status === 404) {
    return <NotFound title="Category not found" message={`We couldn't find a category called "${name}".`} />;
  }

  const total = data ? data.topRated.length + data.additional.length : 0;

  return (
    <div className="container">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label }]} />
      <header className={styles.header}>
        <h1 className={styles.title}>{label}</h1>
        {data && (
          <p className={styles.meta}>
            {total} {total === 1 ? 'product' : 'products'}
          </p>
        )}
      </header>

      {loading && <ProductGridSkeleton count={3} />}
      {error && <ErrorState error={error} onRetry={retry} />}
      {data && (
        <>
          <Section title="Top rated" subtitle={`The best of ${label.toLowerCase()}.`}>
            <ProductGrid products={data.topRated} badge="Top rated" />
          </Section>
          {data.additional.length > 0 && (
            <Section title={`More in ${label.toLowerCase()}`}>
              <ProductGrid products={data.additional} />
            </Section>
          )}
        </>
      )}
    </div>
  );
}
