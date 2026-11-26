import { screen } from '@testing-library/react';
import { mockApi, ok, product } from '../../test/mockApi';
import { renderRoute } from '../../test/render';

describe('Search', () => {
  it('GIVEN a search term WHEN clicking search THEN only shows products returned for that term', async () => {
    const fetchMock = mockApi({
      'GET /api/catalogue/featured': ok({ products: [product('9')] }),
      'GET /api/catalogue/products': (_init, url) => ({
        body: {
          query: url.searchParams.get('q'),
          products: [product('1', { title: 'Classic Backpack' })],
        },
      }),
    });
    const { user, router } = renderRoute('/');
    await screen.findByText('Product 9');

    await user.type(screen.getByRole('searchbox', { name: 'Search products' }), '  backpack ');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByRole('heading', { level: 1, name: /results for “backpack”/i })).toBeInTheDocument();
    expect(await screen.findByText('Classic Backpack')).toBeInTheDocument();
    expect(screen.queryByText('Product 9')).not.toBeInTheDocument();
    expect(screen.getByText('1 product found')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?q=backpack');
    expect(fetchMock).toHaveBeenCalledWith('/api/catalogue/products?q=backpack', expect.anything());
  });

  it('disables the search button until a term is entered', async () => {
    mockApi({ 'GET /api/catalogue/featured': ok({ products: [] }) });
    renderRoute('/');
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
  });

  it('shows a helpful empty state when nothing matches', async () => {
    mockApi({ 'GET /api/catalogue/products': ok({ query: 'zzz', products: [] }) });
    renderRoute('/search?q=zzz');
    expect(await screen.findByRole('heading', { name: 'No matching products' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('zzz');
  });
});
