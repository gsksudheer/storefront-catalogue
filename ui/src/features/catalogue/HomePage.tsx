import { Link } from 'react-router';
import { catalogueApi } from '../../api/endpoints';
import type { CategoriesResponse, Product, ProductsResponse } from '../../api/types';
import { ArrowRightIcon, ChatIcon, ShieldIcon, UserIcon } from '../../components/Icons';
import { ProductGrid } from '../../components/ProductCard';
import { ProductImage } from '../../components/ProductImage';
import { Section } from '../../components/Section';
import { EmptyState, ErrorState, ProductGridSkeleton } from '../../components/States';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { categoryPath, formatCategory, productPath } from '../../lib/format';
import styles from './HomePage.module.css';

export function HomePage() {
  useDocumentTitle();
  const featured = useApi<ProductsResponse>(catalogueApi.featured());
  const categories = useApi<CategoriesResponse>(catalogueApi.categories());
  const products = featured.data?.products ?? [];

  return (
    <div className="container">
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className="eyebrow">Hand-picked by our team</p>
          <h1 className={`display ${styles.heroTitle}`}>
            Good things, <em>thoughtfully</em> chosen.
          </h1>
          <p className={styles.heroText}>
            Browse the catalogue, compare the details and send us an enquiry about anything you like. A real person
            will reply.
          </p>
          <div className={styles.heroActions}>
            <a href="#top-rated" className="btn btn-primary btn-lg">
              Shop top rated <ArrowRightIcon width={18} height={18} />
            </a>
            <a href="#categories" className="btn btn-secondary btn-lg">
              Browse categories
            </a>
          </div>
          <ul className={styles.perks}>
            <li>
              <ChatIcon width={18} height={18} /> Personal replies
            </li>
            <li>
              <UserIcon width={18} height={18} /> No account needed
            </li>
            <li>
              <ShieldIcon width={18} height={18} /> Details used only to reply
            </li>
          </ul>
        </div>
        <HeroCollage products={products.slice(0, 3)} loading={featured.loading} />
      </section>

      <Section
        id="top-rated"
        eyebrow="Top rated"
        title="Our favourite picks"
        subtitle="Five products the team keeps coming back to."
      >
        {featured.loading && <ProductGridSkeleton count={5} />}
        {featured.error && <ErrorState error={featured.error} onRetry={featured.retry} />}
        {featured.data &&
          (products.length > 0 ? (
            <ProductGrid products={products} badge="Top rated" />
          ) : (
            <EmptyState title="No featured products yet" />
          ))}
      </Section>

      {categories.data && categories.data.categories.length > 0 && (
        <Section id="categories" eyebrow="Explore" title="Shop by category">
          <ul className={styles.categories}>
            {categories.data.categories.map((c, i) => (
              <li key={c}>
                <Link to={categoryPath(c)} className={styles.categoryCard} data-tone={i % 4}>
                  <span className={styles.categoryIndex}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={`display ${styles.categoryName}`}>{formatCategory(c)}</span>
                  <span className={styles.categoryCta}>
                    Explore <ArrowRightIcon width={16} height={16} />
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

function HeroCollage({ products, loading }: { products: Product[]; loading: boolean }) {
  if (!loading && products.length === 0) return null;
  return (
    <div className={styles.collage} aria-hidden={loading}>
      {[0, 1, 2].map((i) => {
        const p = products[i];
        return p ? (
          <Link key={p.id} to={productPath(p.id)} className={`${styles.tile} ${styles[`tile${i}`]}`} tabIndex={-1}>
            <ProductImage src={p.imageUrl} alt="" loading="eager" className={styles.tileImage} />
          </Link>
        ) : (
          <div key={i} className={`${styles.tile} ${styles[`tile${i}`]} ${styles.tileLoading}`} />
        );
      })}
    </div>
  );
}
