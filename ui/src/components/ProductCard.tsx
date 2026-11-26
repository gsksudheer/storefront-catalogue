import { Link } from 'react-router';
import type { Product } from '../api/types';
import { formatCategory, formatPrice, productPath } from '../lib/format';
import { ProductImage } from './ProductImage';
import { Rating } from './Rating';
import styles from './ProductCard.module.css';

export function ProductCard({ product, badge }: { product: Product; badge?: string }) {
  return (
    <article className={styles.card}>
      <Link to={productPath(product.id)} className={styles.link}>
        <div className={styles.media}>
          {badge && <span className={styles.badge}>{badge}</span>}
          <ProductImage src={product.imageUrl} alt="" className={styles.image} />
        </div>
        <div className={styles.body}>
          <p className={styles.category}>{formatCategory(product.category)}</p>
          <h3 className={styles.title}>{product.title}</h3>
          <Rating rate={product.rating.rate} count={product.rating.count} />
          <p className={styles.price}>{formatPrice(product.price)}</p>
        </div>
      </Link>
    </article>
  );
}

export function ProductGrid({ products, badge }: { products: Product[]; badge?: string }) {
  return (
    <ul className={styles.grid}>
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} badge={badge} />
        </li>
      ))}
    </ul>
  );
}
