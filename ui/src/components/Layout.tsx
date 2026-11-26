import { Link, Outlet, ScrollRestoration, useSearchParams } from 'react-router';
import { CategoryNav } from './CategoryNav';
import { SearchBar } from './SearchBar';
import styles from './Layout.module.css';

export function Layout() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={`container ${styles.headerRow}`}>
          <Link to="/" className={styles.brand} aria-label="Storefront home">
            <span className={styles.logo} aria-hidden="true">
              S
            </span>
            Storefront
          </Link>
          {/* key resets the input when the URL's query changes (e.g. back/forward). */}
          <SearchBar key={q} initialQuery={q} />
        </div>
        <CategoryNav />
      </header>

      <main id="main" className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className="container">
          <p>© {new Date().getFullYear()} Storefront · Proof of concept</p>
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
