'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gray-50">
      <div className="text-center max-w-md">
        <h2 className="text-3xl font-bold text-amber-700 mb-2">404</h2>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Page Not Found</h3>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-medium transition-colors inline-block"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
