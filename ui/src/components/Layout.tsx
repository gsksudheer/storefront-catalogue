import { Link, Outlet } from 'react-router';

export function Layout() {
  return (
    <>
      <header>
        <Link to="/">Storefront</Link>
        {/* TODO(step 4): search bar + category nav */}
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
