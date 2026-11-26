import { screen, within } from '@testing-library/react';
import { fail, mockApi, ok, product } from '../../test/mockApi';
import { renderRoute } from '../../test/render';

describe('Category page', () => {
  it('GIVEN categories WHEN clicking a category link THEN shows top rated and additional products', async () => {
    const fetchMock = mockApi({
      'GET /api/catalogue/featured': ok({ products: [] }),
      "GET /api/catalogue/categories/men's%20clothing": ok({
        category: "men's clothing",
        topRated: [product('1'), product('3'), product('2')],
        additional: [product('4')],
      }),
    });
    const { user } = renderRoute('/');

    const nav = await screen.findByRole('navigation', { name: 'Categories' });
    await user.click(within(nav).getByRole('link', { name: "Men's clothing" }));

    expect(await screen.findByRole('heading', { level: 1, name: "Men's clothing" })).toBeInTheDocument();
    const top = screen.getByRole('region', { name: 'Top rated' });
    expect(within(top).getAllByRole('article')).toHaveLength(3);
    const more = screen.getByRole('region', { name: /more in men's clothing/i });
    expect(within(more).getByText('Product 4')).toBeInTheDocument();
    expect(screen.getByText('4 products')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/catalogue/categories/men's%20clothing", expect.anything());
  });

  it('shows a not-found state for an unknown category', async () => {
    mockApi({ 'GET /api/catalogue/categories/toys': fail(404, 'NOT_FOUND') });
    renderRoute('/category/toys');
    expect(await screen.findByRole('heading', { name: 'Category not found' })).toBeInTheDocument();
  });
});
