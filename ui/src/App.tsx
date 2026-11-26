import { createBrowserRouter, RouterProvider } from 'react-router';
import { Layout } from './components/Layout';
import { HomePage } from './features/catalogue/HomePage';

export const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [{ index: true, element: <HomePage /> }],
  },
];

const router = createBrowserRouter(routes);

export function App() {
  return <RouterProvider router={router} />;
}
