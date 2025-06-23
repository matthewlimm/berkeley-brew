'use client';

import { useState, useEffect } from 'react';
import { getCafe } from '../services/api';
import type { Database } from '@berkeley-brew/api/src/types/database.types';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

// Define the User type
type User = {
  id: string;
  username: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
};

// Define the review type from the database
type ReviewRow = Database['public']['Tables']['reviews']['Row'];

// Extend the base Review type to include the user property
type ExtendedReview = ReviewRow & {
  user?: User;
};

// Define the response type from the API
type CafeResponse = {
  data?: {
    cafe: {
      reviews: ExtendedReview[];
    };
  };
};

interface CafeReviewsProps {
  cafeId: string;
}

import { useAuth } from '@/contexts/AuthContext';

export function CafeReviews({ cafeId }: CafeReviewsProps) {
  const [reviews, setReviews] = useState<ExtendedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const { user: currentUser } = useAuth();

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState<ExtendedReview | null>(null);
  const [editFormData, setEditFormData] = useState({
    content: '',
    grindability_score: 5,
    student_friendliness_score: 5,
    coffee_quality_score: 5,
    vibe_score: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to render rating input (copied from MyReviewsPage)
  const renderRatingInput = (name: string, label: string, value: number) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1 flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setEditFormData({ ...editFormData, [name]: star })}
              className="focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-6 w-6 ${star <= Number(editFormData[name as keyof typeof editFormData]) ? 'text-amber-500' : 'text-gray-300'}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    );
  };


  useEffect(() => {
    loadReviews();
  }, [cafeId]);

  const loadReviews = async () => {
    try {
      const response = await getCafe(cafeId);
      const reviewsData = response.data?.cafe.reviews || [];
      setReviews(reviewsData);
      
      // Load avatar URLs for users who have reviews
      const userIds = reviewsData
        .filter(review => review.user_id)
        .map(review => review.user_id as string);
      
      if (userIds.length > 0) {
        fetchAvatarUrls(userIds);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAvatarUrls = async (userIds: string[]) => {
    try {
      // Get avatar URLs from users table or storage
      const { data: users } = await supabase
        .from('users')
        .select('id, avatar_url')
        .in('id', userIds);
      
      if (users) {
        const urlMap: Record<string, string> = {};
        for (const user of users) {
          if (user.avatar_url) {
            urlMap[user.id] = user.avatar_url;
          } else {
            // Check if avatar exists in storage bucket based on memory info
            try {
              const { data } = await supabase.storage
                .from('avatars')
                .list(`${user.id}`, {
                  limit: 1,
                  sortBy: { column: 'created_at', order: 'desc' }
                });
              
              if (data && data.length > 0) {
                // Get public URL for the avatar
                const { data: publicUrl } = supabase.storage
                  .from('avatars')
                  .getPublicUrl(`${user.id}/avatar`);
                  
                if (publicUrl) {
                  urlMap[user.id] = publicUrl.publicUrl;
                  continue;
                }
              }
            } catch (storageError) {
              console.error('Error checking storage:', storageError);
            }
            
            // Use default avatar if no avatar_url
            urlMap[user.id] = `https://ui-avatars.com/api/?name=${encodeURIComponent((user.id || '').substring(0, 2))}&background=random`;
          }
        }
        setAvatarUrls(urlMap);
      }
    } catch (error) {
      console.error('Error fetching avatar URLs:', error);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-5 bg-white rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gray-200 h-10 w-10 rounded-full"></div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="ml-auto h-6 bg-gray-200 rounded-full w-12"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="grid grid-cols-2 gap-3 mt-4 bg-gray-50 p-3 rounded-lg">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
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
      <div className="space-y-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-5 bg-white rounded-lg border border-gray-100 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                {/* User Avatar */}
                {/* User Avatar */}
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                  {review.user_id && avatarUrls[review.user_id] ? (
                    <Image 
                      src={avatarUrls[review.user_id]}
                      alt={(review.user?.username || 'User')}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-amber-100 text-amber-800 text-sm font-medium">
                      {review.user?.username ? review.user.username[0].toUpperCase() : 'A'}
                    </div>
                  )}
                </div>
                
                {/* User Info */}
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {review.user?.username || 'Anonymous User'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {review.created_at ? new Date(review.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'Unknown date'}
                  </div>
                </div>
              </div>
              
              {/* Overall Score Badge */}
              <div className="px-3 py-1.5 bg-amber-50 rounded-full text-sm font-medium text-amber-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {review.golden_bear_score?.toFixed(1) || 'N/A'}
              </div>
            </div>
            
            {/* Review Content */}
            <div className="mb-4 text-gray-700 text-sm border-l-4 border-amber-200 pl-3 py-1">
              {review.content}
            </div>
            
            {/* Detailed Scores */}
            <div className="grid grid-cols-2 gap-3 mt-4 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-600 mr-2"></div>
                <span className="text-xs text-gray-600">Grindability:</span>
                <span className="text-xs font-medium text-blue-700 ml-1">{review.grindability_score?.toFixed(1) || 'N/A'}</span>
              </div>
              
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-pink-600 mr-2"></div>
                <span className="text-xs text-gray-600">Vibe:</span>
                <span className="text-xs font-medium text-pink-700 ml-1">{review.vibe_score?.toFixed(1) || 'N/A'}</span>
              </div>
              
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-purple-600 mr-2"></div>
                <span className="text-xs text-gray-600">Coffee:</span>
                <span className="text-xs font-medium text-purple-700 ml-1">{review.coffee_quality_score?.toFixed(1) || 'N/A'}</span>
              </div>
              
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-600 mr-2"></div>
                <span className="text-xs text-gray-600">Friendliness:</span>
                <span className="text-xs font-medium text-green-700 ml-1">{review.student_friendliness_score?.toFixed(1) || 'N/A'}</span>
              </div>
            </div>
          {/* Edit Review Button for Owner (bottom right) */}
          {currentUser?.id === review.user_id && (
            <div className="flex justify-end mt-4">
              <button
                className="px-3 py-1.5 bg-amber-600 text-white rounded shadow hover:bg-amber-700 text-xs font-semibold transition-all duration-150"
                onClick={() => {
                  setCurrentReview(review);
                  setEditFormData({
                    content: review.content,
                    grindability_score: review.grindability_score || 5,
                    student_friendliness_score: review.student_friendliness_score || 5,
                    coffee_quality_score: review.coffee_quality_score || 5,
                    vibe_score: review.vibe_score || 5
                  });
                  setIsEditModalOpen(true);
                }}
              >
                Edit Review
              </button>
            </div>
          )}

          {/* Edit Review Modal */}
          {isEditModalOpen && currentReview && currentReview.id === review.id && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Review</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  try {
                    // updateReview should be imported from @/services/api
                    // @ts-ignore
                    const { updateReview } = await import('@/services/api');
                    await updateReview(currentReview.id, editFormData);
                    setIsEditModalOpen(false);
                    setCurrentReview(null);
                    await loadReviews();
                  } catch (err) {
                    alert('Failed to update review. Please try again.');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}>
                  {/* Rating inputs */}
                  <div className="mb-4">
                    <p className="block text-sm font-medium text-gray-700">Golden Bear Score (Auto-calculated)</p>
                    <div className="mt-1 flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 ${i < (currentReview.golden_bear_score || 0) ? 'text-amber-500' : 'text-gray-300'}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  {renderRatingInput('grindability_score', 'Grindability', editFormData.grindability_score)}
                  {renderRatingInput('vibe_score', 'Vibe', editFormData.vibe_score)}
                  {renderRatingInput('coffee_quality_score', 'Coffee Quality', editFormData.coffee_quality_score)}
                  {renderRatingInput('student_friendliness_score', 'Friendliness', editFormData.student_friendliness_score)}
                  {/* Content textarea */}
                  <div className="mb-4">
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">Review</label>
                    <textarea
                      id="content"
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                      value={editFormData.content}
                      onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                      required
                    />
                  </div>
                  {/* Action buttons */}
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:col-start-2 sm:text-sm"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsEditModalOpen(false); setCurrentReview(null); }}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
  );
}
