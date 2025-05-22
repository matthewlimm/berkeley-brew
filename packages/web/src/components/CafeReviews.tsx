'use client';

import { useState, useEffect } from 'react';
import { getCafe, editReview } from '../services/api';
import type { Database } from '@berkeley-brew/api/src/db';

// Extend the base Review type to include the user property
type Review = Database['public']['Tables']['reviews']['Row'] & {
  user?: {
    id: string;
    username: string;
  };
  updated_at?: string | null;
};

interface CafeReviewsProps {
  cafeId: string;
  currentUserId?: string;
}

export function CafeReviews({ cafeId, currentUserId }: CafeReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    loadReviews();
  }, [cafeId]);

  const loadReviews = async () => {
    try {
      const response = await getCafe(cafeId);
      // Debug: log the raw reviews array
      console.log('Raw reviews from API:', response.data?.cafe.reviews);
      // Patch: ensure updated_at is present
      const patchedReviews = (response.data?.cafe.reviews || []).map((r: any) => ({
        ...r,
        updated_at: r.updated_at ?? r.updatedAt ?? undefined,
      }));
      setReviews(patchedReviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };


  const handleEditClick = (review: Review) => {
    setEditingReviewId(review.id);
    setEditContent(review.content || '');
    setEditRating(review.rating || 5);
    setEditError('');
  };

  const handleEditCancel = () => {
    setEditingReviewId(null);
    setEditContent('');
    setEditRating(5);
    setEditError('');
  };

  const handleEditSave = async (reviewId: string) => {
    try {
      await editReview(reviewId, { content: editContent, rating: editRating });
      setEditingReviewId(null);
      setEditContent('');
      setEditRating(5);
      setEditError('');
      loadReviews();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update review');
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

  // Debug: print created_at and updated_at for each review
  reviews.forEach(r => {
    console.log(
      "Review", r.id,
      "created_at:", r.created_at,
      "updated_at:", r.updated_at,
      "showEditedLabel:", !!(r.updated_at && r.updated_at !== r.created_at)
    );
  });
  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const isEditing = editingReviewId === review.id;
        const isOwn = review.user_id === currentUserId;
        const lastEdited = review.updated_at && review.updated_at !== review.created_at;
        return (
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
                    Posted: {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Unknown date'}
                    {review.updated_at && review.updated_at !== review.created_at && (
  <span className="ml-2">
    | Edited: {new Date(review.updated_at).toLocaleDateString()}
  </span>
)}

                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-600">
                  {review.rating} ★
                </div>
                {isOwn && !isEditing && (
                  <button
                    className="ml-2 text-xs text-blue-600 underline hover:text-blue-800"
                    onClick={() => handleEditClick(review)}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  className="w-full rounded border-gray-300"
                  rows={3}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  required
                />
                <div>
                  <label className="text-xs mr-2">Rating:</label>
                  <select
                    value={editRating}
                    onChange={e => setEditRating(Number(e.target.value))}
                    className="rounded border-gray-300"
                  >
                    {[5, 4, 3, 2, 1].map(val => (
                      <option key={val} value={val}>{val} {val === 1 ? 'star' : 'stars'}</option>
                    ))}
                  </select>
                </div>
                {editError && <div className="text-xs text-red-600">{editError}</div>}
                <div className="flex gap-2">
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                    onClick={() => handleEditSave(review.id)}
                  >Save</button>
                  <button
                    className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-300"
                    onClick={handleEditCancel}
                  >Cancel</button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 text-sm">{review.content}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
