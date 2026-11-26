import { NavLink } from 'react-router';
import { catalogueApi } from '../api/endpoints';
import type { CategoriesResponse } from '../api/types';
import { useApi } from '../hooks/useApi';
import { categoryPath, formatCategory } from '../lib/format';
import styles from './CategoryNav.module.css';

export function CategoryNav() {
  const { data } = useApi<CategoriesResponse>(catalogueApi.categories());
  // Progressive: if categories fail to load, the rest of the page still works.
  if (!data?.categories.length) return null;

  const cls = ({ isActive }: { isActive: boolean }) => `${styles.link} ${isActive ? styles.active : ''}`;
  return (
    <nav aria-label="Categories" className={styles.nav}>
      <ul className={`container ${styles.list}`}>
        <li>
          <NavLink to="/" end className={cls}>
            All products
          </NavLink>
        </li>
        {data.categories.map((c) => (
          <li key={c}>
            <NavLink to={categoryPath(c)} className={cls}>
              {formatCategory(c)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
