import { screen, within } from '@testing-library/react';
import { mockApi, ok, product } from '../../test/mockApi';
import { renderRoute } from '../../test/render';

const searchBox = () => screen.getByRole('combobox', { name: 'Search products' });

describe('Search', () => {
  it('GIVEN a search term WHEN clicking search THEN only shows products returned for that term', async () => {
    const fetchMock = mockApi({
      'GET /api/catalogue/featured': ok({ products: [product('9')] }),
      'GET /api/catalogue/products': (_init, url) => ({
        body: { query: url.searchParams.get('q'), products: [product('1', { title: 'Classic Backpack' })] },
      }),
    });
    const { user, router } = renderRoute('/');
    await screen.findAllByText('Product 9');

    await user.type(searchBox(), '  backpack ');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByRole('heading', { level: 1, name: /results for “backpack”/i })).toBeInTheDocument();
    expect(await screen.findByText('Classic Backpack')).toBeInTheDocument();
    expect(screen.queryByText('Product 9')).not.toBeInTheDocument();
    expect(screen.getByText('1 product found')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?q=backpack');
    expect(fetchMock).toHaveBeenCalledWith('/api/catalogue/products?q=backpack', expect.anything());
  });

  it('does not navigate on an empty search', async () => {
    mockApi({ 'GET /api/catalogue/featured': ok({ products: [] }) });
    const { user, router } = renderRoute('/');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(router.state.location.pathname).toBe('/');
    expect(searchBox()).toHaveFocus();
  });

  it('suggests matching products while typing and opens one on click', async () => {
    const backpack = product('1', { title: 'Classic Backpack' });
    mockApi({
      'GET /api/catalogue/featured': ok({ products: [] }),
      'GET /api/catalogue/products': ok({ query: 'back', products: [backpack] }),
      'GET /api/catalogue/products/1': ok({ product: backpack }),
    });
    const { user, router } = renderRoute('/');

    await user.type(searchBox(), 'back');
    const listbox = await screen.findByRole('listbox', { name: 'Suggestions' });
    await user.click(within(listbox).getByRole('option', { name: /classic backpack/i }));

    expect(router.state.location.pathname).toBe('/product/1');
    expect(await screen.findByRole('heading', { level: 1, name: 'Classic Backpack' })).toBeInTheDocument();
  });

  it('supports keyboard selection of a suggestion', async () => {
    mockApi({
      'GET /api/catalogue/featured': ok({ products: [] }),
      'GET /api/catalogue/products': ok({ query: 'ss', products: [product('6'), product('7')] }),
      'GET /api/catalogue/products/7': ok({ product: product('7') }),
    });
    const { user, router } = renderRoute('/');
    await user.type(searchBox(), 'ss');
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(router.state.location.pathname).toBe('/product/7');
  });

  it('can clear the search box', async () => {
    mockApi({ 'GET /api/catalogue/products': ok({ query: 'zzz', products: [] }) });
    const { user } = renderRoute('/search?q=zzz');
    expect(searchBox()).toHaveValue('zzz');
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(searchBox()).toHaveValue('');
    expect(searchBox()).toHaveFocus();
  });

  it('shows a helpful empty state when nothing matches', async () => {
    mockApi({ 'GET /api/catalogue/products': ok({ query: 'zzz', products: [] }) });
    renderRoute('/search?q=zzz');
    expect(await screen.findByRole('heading', { name: 'No matching products' })).toBeInTheDocument();
  });

  it('filters results by category and sorts them', async () => {
    mockApi({
      'GET /api/catalogue/products': ok({
        query: 'x',
        products: [
          product('1', { title: 'Cheap jacket', price: 10, category: "men's clothing" }),
          product('2', { title: 'Pricey drive', price: 300, category: 'electronics' }),
          product('3', { title: 'Mid drive', price: 50, category: 'electronics' }),
        ],
      }),
    });
    const { user } = renderRoute('/search?q=x');
    await screen.findByText('Cheap jacket');
    const titles = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

    await user.click(screen.getByRole('button', { name: /electronics/i }));
    expect(titles()).toEqual(['Pricey drive', 'Mid drive']);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'price-asc');
    expect(titles()).toEqual(['Mid drive', 'Pricey drive']);

    await user.click(screen.getByRole('button', { name: /^all/i }));
    expect(titles()).toEqual(['Cheap jacket', 'Mid drive', 'Pricey drive']);
  });
});
