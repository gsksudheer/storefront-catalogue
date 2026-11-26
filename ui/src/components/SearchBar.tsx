import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import { searchPath } from '../lib/format';
import styles from './SearchBar.module.css';

export function SearchBar({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(searchPath(q));
  }

  return (
    <form role="search" className={styles.form} onSubmit={onSubmit}>
      <label htmlFor="site-search" className="visually-hidden">
        Search products
      </label>
      <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true">
        <path
          fill="currentColor"
          d="M8.5 3a5.5 5.5 0 0 1 4.38 8.82l3.65 3.65a.75.75 0 1 1-1.06 1.06l-3.65-3.65A5.5 5.5 0 1 1 8.5 3Zm0 1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
        />
      </svg>
      <input
        id="site-search"
        type="search"
        className={styles.input}
        placeholder="Search products…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        maxLength={100}
        autoComplete="off"
        enterKeyHint="search"
      />
      <button type="submit" className={`btn btn-primary ${styles.button}`} disabled={!query.trim()}>
        Search
      </button>
    </form>
  );
}
