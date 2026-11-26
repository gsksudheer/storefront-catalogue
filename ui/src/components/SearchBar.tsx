import { type FormEvent, type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { catalogueApi } from '../api/endpoints';
import type { SearchResponse } from '../api/types';
import { useApi } from '../hooks/useApi';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatPrice, productPath, searchPath } from '../lib/format';
import { ArrowRightIcon, CloseIcon, SearchIcon } from './Icons';
import { ProductImage } from './ProductImage';
import styles from './SearchBar.module.css';

const MAX_SUGGESTIONS = 5;

/**
 * Search box with live suggestions (ARIA combobox pattern).
 * Submitting (button or Enter) goes to the full results page, as the acceptance criteria require;
 * suggestions are a shortcut on top, served by the same backend search endpoint.
 */
export function SearchBar({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const listId = useId();

  const term = useDebouncedValue(query.trim(), 200);
  const { data, loading } = useApi<SearchResponse>(open && term.length >= 2 ? catalogueApi.search(term) : null);
  const suggestions = data?.products.slice(0, MAX_SUGGESTIONS) ?? [];
  const showList = open && term.length >= 2 && (loading || data !== undefined);

  // "/" focuses search from anywhere, like many storefronts and docs sites.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) && !el.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function go(path: string) {
    setOpen(false);
    setActive(-1);
    inputRef.current?.blur();
    navigate(path);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      inputRef.current?.focus();
      return;
    }
    const picked = active >= 0 ? suggestions[active] : undefined;
    go(picked ? productPath(picked.id) : searchPath(q));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' && suggestions.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp' && suggestions.length) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <form role="search" className={styles.form} onSubmit={onSubmit}>
      <label htmlFor="site-search" className="visually-hidden">
        Search products
      </label>
      <div className={styles.field}>
        <SearchIcon className={styles.icon} />
        <input
          ref={inputRef}
          id="site-search"
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className={styles.input}
          placeholder="Search products…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          maxLength={100}
          autoComplete="off"
          enterKeyHint="search"
        />
        {query ? (
          <button
            type="button"
            className={styles.clear}
            aria-label="Clear search"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery('');
              setActive(-1);
              inputRef.current?.focus();
            }}
          >
            <CloseIcon width={16} height={16} />
          </button>
        ) : (
          <kbd className={styles.kbd} aria-hidden="true">
            /
          </kbd>
        )}
        <button type="submit" className={`btn btn-primary ${styles.button}`}>
          Search
        </button>
      </div>

      {showList && (
        // onMouseDown preventDefault keeps focus in the input so clicks register before blur closes the list.
        <div className={styles.panel} onMouseDown={(e) => e.preventDefault()}>
          {loading && <p className={styles.status}>Searching…</p>}
          {!loading && suggestions.length === 0 && (
            <p className={styles.status}>No products match “{term}”</p>
          )}
          {suggestions.length > 0 && (
            <ul id={listId} role="listbox" aria-label="Suggestions" className={styles.list}>
              {suggestions.map((p, i) => (
                <li
                  key={p.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={`${styles.option} ${i === active ? styles.optionActive : ''}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(productPath(p.id))}
                >
                  <span className={styles.thumb}>
                    <ProductImage src={p.imageUrl} alt="" />
                  </span>
                  <span className={styles.optionText}>
                    <span className={styles.optionTitle}>{p.title}</span>
                    <span className={styles.optionMeta}>{formatPrice(p.price)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {data && data.products.length > 0 && (
            <button type="submit" className={styles.seeAll}>
              See all {data.products.length} results for “{term}” <ArrowRightIcon width={16} height={16} />
            </button>
          )}
        </div>
      )}
    </form>
  );
}
