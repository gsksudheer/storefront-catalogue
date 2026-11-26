import { fireEvent, render, screen } from '@testing-library/react';
import { ProductImage } from './ProductImage';

describe('ProductImage', () => {
  it('shows a placeholder instead of a broken image when loading fails', () => {
    render(<ProductImage src="https://img.test/broken.png" alt="Backpack" />);
    fireEvent.error(screen.getByRole('img', { name: 'Backpack' }));
    expect(screen.getByText('Image unavailable')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Backpack' }).tagName).toBe('DIV');
  });
});
