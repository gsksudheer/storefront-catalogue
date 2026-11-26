const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** Assumption: Fake Store prices are USD. Locale/currency become config when the real catalogue lands. */
export const formatPrice = (value: number) => currency.format(value);

/** "men's clothing" -> "Men's clothing" */
export const formatCategory = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

export const categoryPath = (name: string) => `/category/${encodeURIComponent(name)}`;
export const productPath = (id: string) => `/product/${encodeURIComponent(id)}`;
export const searchPath = (q: string) => `/search?q=${encodeURIComponent(q)}`;
