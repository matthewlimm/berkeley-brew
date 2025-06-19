'use client';

import { useState, useEffect } from 'react';
import { getCafe } from '../services/api';
import type { Database } from '@berkeley-brew/api/src/db';

// Extend the base Review type to include the user property
type Review = Database['public']['Tables']['reviews']['Row'] & {
  user?: {
    id: string;
    username: string;
  };
};

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
    <div>
      {/* Review count badge */}
      <div className="flex items-center mb-4">
        <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded-full">
          {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
        </span>
      </div>
      
      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {review.user?.username || 'Anonymous User'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Unknown date'}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="px-2 py-1 bg-amber-50 rounded-full text-xs font-medium text-amber-700 mb-1">
                  {review.golden_bear_score?.toFixed(1) || 'N/A'} ★
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                  <div className="text-blue-700">Grindability: {review.grindability_score?.toFixed(1) || 'N/A'}</div>
                  <div className="text-pink-700">Vibe: {review.vibe_score?.toFixed(1) || 'N/A'}</div>
                  <div className="text-purple-700">Coffee: {review.coffee_quality_score?.toFixed(1) || 'N/A'}</div>
                  <div className="text-green-700">Friendliness: {review.student_friendliness_score?.toFixed(1) || 'N/A'}</div>
                </div>
              </div>
            </div>
            <p className="text-gray-700 text-sm">{review.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
