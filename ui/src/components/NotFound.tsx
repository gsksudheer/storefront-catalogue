import { Link } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { EmptyState } from './States';

export function NotFound({ title = 'Page not found', message }: { title?: string; message?: string }) {
  useDocumentTitle(title);
  return (
    <div className="container">
      <EmptyState title={title} icon="404">
        <p>{message ?? "The page you're looking for doesn't exist or has moved."}</p>
        <p style={{ marginTop: 'var(--space-4)' }}>
          <Link to="/" className="btn btn-primary">
            Back to home
          </Link>
        </p>
      </EmptyState>
    </div>
  );
}
