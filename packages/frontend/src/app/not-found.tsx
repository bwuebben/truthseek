import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <h1 className="text-8xl font-bold text-dark-600">404</h1>
        <h2 className="text-2xl font-semibold text-text-primary mt-4 mb-4">
          Page not found
        </h2>
        <p className="text-text-muted mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
          <Link href="/" className="btn-secondary">
            Explore Claims
          </Link>
        </div>
      </div>
    </div>
  );
}
