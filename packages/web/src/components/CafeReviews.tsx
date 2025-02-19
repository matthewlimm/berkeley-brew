'use client';

import { useState, useEffect } from 'react';
import { getCafe } from '../services/api';
import type { Database } from '@berkeley-brew/api/src/db';

type Review = Database['public']['Tables']['reviews']['Row'];

interface CafeReviewsProps {
  cafeId: string;
}

export function CafeReviews({ cafeId }: CafeReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReviews();
  }, [cafeId]);

  const loadReviews = async () => {
    try {
      const response = await getCafe(cafeId);
      setReviews(response.data?.cafe.reviews || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-gray-100 h-24 rounded-md"></div>
      ))}
    </div>;
  }

  if (error) {
    return <p className="text-red-600 text-sm">{error}</p>;
  }

  if (reviews.length === 0) {
    return <p className="text-gray-500 text-sm">No reviews yet. Be the first to review!</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm text-blue-600">
                  {review.user_id.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  User {review.user_id.slice(0, 6)}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-600">
              {review.rating} ★
            </div>
          </div>
          <p className="text-gray-700 text-sm">{review.content}</p>
        </div>
      ))}
    </div>
  );
}
