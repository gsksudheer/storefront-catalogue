import { NavLink } from 'react-router';
import { catalogueApi } from '../api/endpoints';
import type { CategoriesResponse } from '../api/types';
import { useApi } from '../hooks/useApi';
import { categoryPath, formatCategory } from '../lib/format';
import styles from './CategoryNav.module.css';

export function CategoryNav() {
  const { data } = useApi<CategoriesResponse>(catalogueApi.categories());
  // Navigation is progressive: if categories fail to load, the rest of the page still works.
  if (!data?.categories.length) return null;

  return (
    <nav aria-label="Categories" className={styles.nav}>
      <ul className={`container ${styles.list}`}>
        <li>
          <NavLink to="/" end className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
            All
          </NavLink>
        </li>
        {data.categories.map((c) => (
          <li key={c}>
            <NavLink
              to={categoryPath(c)}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
              {formatCategory(c)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
