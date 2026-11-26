import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '../App';

/** Render the real route tree at a given URL, with a user-event instance. */
export function renderRoute(url = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  const user = userEvent.setup();
  return { router, user, ...render(<RouterProvider router={router} />) };
}
