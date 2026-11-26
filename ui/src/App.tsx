import { createBrowserRouter, RouterProvider, type RouteObject } from 'react-router';
import { Layout } from './components/Layout';
import { NotFound } from './components/NotFound';
import { CategoryPage } from './features/catalogue/CategoryPage';
import { HomePage } from './features/catalogue/HomePage';
import { ProductPage } from './features/catalogue/ProductPage';
import { SearchPage } from './features/catalogue/SearchPage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'category/:name', element: <CategoryPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'product/:id', element: <ProductPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

const router = createBrowserRouter(routes);

export function App() {
  return <RouterProvider router={router} />;
}
