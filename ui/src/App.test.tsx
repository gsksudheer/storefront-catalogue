import { screen } from '@testing-library/react';
import { renderRoute } from './test/render';

describe('App', () => {
  it('renders the home page inside the layout', () => {
    renderRoute('/');
    expect(screen.getByRole('link', { name: 'Storefront' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /featured products/i })).toBeInTheDocument();
  });
});
