import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '../App';

/** Render the real route tree at a given URL. */
export function renderRoute(url = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  return { router, ...render(<RouterProvider router={router} />) };
}
