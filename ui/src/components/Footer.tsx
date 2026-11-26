import { Link } from 'react-router';
import { catalogueApi } from '../api/endpoints';
import type { CategoriesResponse } from '../api/types';
import { useApi } from '../hooks/useApi';
import { demoInboxUrl } from '../lib/config';
import { categoryPath, formatCategory } from '../lib/format';
import { Logo } from './Logo';
import styles from './Footer.module.css';

export function Footer() {
  const { data } = useApi<CategoriesResponse>(catalogueApi.categories());
  const inbox = demoInboxUrl();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <Logo />
          <p className={styles.blurb}>
            A small catalogue of hand-picked products. Found something you like? Send an enquiry and we'll reply
            personally.
          </p>
        </div>

        {data && data.categories.length > 0 && (
          <nav aria-label="Footer categories">
            <h2 className={styles.heading}>Shop</h2>
            <ul className={styles.links}>
              {data.categories.map((c) => (
                <li key={c}>
                  <Link to={categoryPath(c)}>{formatCategory(c)}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {inbox && (
          <div>
            <h2 className={styles.heading}>For reviewers</h2>
            <ul className={styles.links}>
              <li>
                <a href={inbox} target="_blank" rel="noreferrer">
                  Demo sales inbox (Mailpit) ↗
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>
      <div className={`container ${styles.bottom}`}>
        <p>© {new Date().getFullYear()} Storefront</p>
        <p>Proof of concept · Product data from Fake Store API</p>
      </div>
    </footer>
  );
}
