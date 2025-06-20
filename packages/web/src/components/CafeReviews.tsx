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

export function CafeReviews({ cafeId }: CafeReviewsProps) {
  const [reviews, setReviews] = useState<ExtendedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});

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
          </div>
        ))}
      </div>
    </div>
  );
}
