import { screen, within } from '@testing-library/react';
import { fail, mockApi, ok, product } from '../../test/mockApi';
import { renderRoute } from '../../test/render';

const featured = ['1', '5', '9', '14', '18'].map((id) => product(id));

describe('Home page', () => {
  it('GIVEN 5 chosen top rated products WHEN viewing home THEN shows exactly those 5', async () => {
    mockApi({ 'GET /api/catalogue/featured': ok({ products: featured }) });
    renderRoute('/');

    const section = await screen.findByRole('region', { name: 'Top rated' });
    const titles = await within(section).findAllByRole('heading', { level: 3 });
    expect(titles.map((t) => t.textContent)).toEqual(featured.map((p) => p.title));
  });

  it('links to each category from the navigation', async () => {
    mockApi({ 'GET /api/catalogue/featured': ok({ products: featured }) });
    renderRoute('/');
    const nav = await screen.findByRole('navigation', { name: 'Categories' });
    expect(within(nav).getByRole('link', { name: "Men's clothing" })).toHaveAttribute(
      'href',
      "/category/men's%20clothing",
    );
  });

  it('shows a friendly error with retry when the catalogue is unavailable', async () => {
    let calls = 0;
    mockApi({
      'GET /api/catalogue/featured': () =>
        ++calls === 1
          ? { status: 502, body: { error: { code: 'UPSTREAM_UNAVAILABLE', message: 'Catalogue unavailable' } } }
          : { body: { products: featured } },
    });
    const { user } = renderRoute('/');

    expect(await screen.findByRole('alert')).toHaveTextContent('Catalogue unavailable');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(featured[0]!.title)).toBeInTheDocument();
  });

  it('still renders if categories fail to load', async () => {
    mockApi({
      'GET /api/catalogue/featured': ok({ products: featured }),
      'GET /api/catalogue/categories': fail(502, 'UPSTREAM_UNAVAILABLE'),
    });
    renderRoute('/');
    expect(await screen.findByText(featured[0]!.title)).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Categories' })).not.toBeInTheDocument();
  });
});
