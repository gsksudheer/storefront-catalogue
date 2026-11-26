import { Link, Outlet, ScrollRestoration, useSearchParams } from 'react-router';
import { demoInboxUrl } from '../lib/config';
import { CategoryNav } from './CategoryNav';
import { Footer } from './Footer';
import { MailIcon } from './Icons';
import { Logo } from './Logo';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from './ThemeToggle';
import styles from './Layout.module.css';

export function Layout() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const inbox = demoInboxUrl();

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={`container ${styles.headerRow}`}>
          <Link to="/" className={styles.brand} aria-label="Storefront home">
            <Logo />
          </Link>
          <div className={styles.search}>
            {/* key resets the input when the URL's query changes (e.g. back/forward). */}
            <SearchBar key={q} initialQuery={q} />
          </div>
          <div className={styles.actions}>
            {inbox && (
              <a
                href={inbox}
                target="_blank"
                rel="noreferrer"
                className={styles.inbox}
                title="Open the demo sales inbox (Mailpit) in a new tab"
              >
                <MailIcon />
                <span className={styles.inboxLabel}>Inbox</span>
                <span className={styles.demoTag}>demo</span>
              </a>
            )}
            <ThemeToggle />
          </div>
        </div>
        <CategoryNav />
      </header>

      <main id="main" className={styles.main}>
        <Outlet />
      </main>

      <Footer />
      <ScrollRestoration />
    </div>
  );
}
