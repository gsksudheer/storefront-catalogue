import { screen } from '@testing-library/react';
import { fail, mockApi, ok, product } from '../../test/mockApi';
import { renderRoute } from '../../test/render';

describe('Product page', () => {
  it('GIVEN browsing WHEN clicking a product tile THEN shows the product details page', async () => {
    const p = product('5', { title: 'Gold Bracelet', price: 695, description: 'Hand-crafted gold.' });
    mockApi({
      'GET /api/catalogue/featured': ok({ products: [p] }),
      'GET /api/catalogue/products/5': ok({ product: p }),
    });
    const { user, router } = renderRoute('/');

    await user.click(await screen.findByRole('link', { name: /gold bracelet/i }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Gold Bracelet' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/product/5');
    expect(screen.getByText('$695.00')).toBeInTheDocument();
    expect(screen.getByText('Hand-crafted gold.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Gold Bracelet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enquire/i })).toBeInTheDocument();
  });

  it('shows a not-found state for an unknown product', async () => {
    mockApi({ 'GET /api/catalogue/products/999': fail(404, 'NOT_FOUND') });
    renderRoute('/product/999');
    expect(await screen.findByRole('heading', { name: 'Product not found' })).toBeInTheDocument();
  });
});
