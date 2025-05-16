'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { getUserReviews } from '@/services/api';

interface Review {
  id: string;
  cafe_id: string | null;
  cafe_name: string;
  rating: number | null;
  content: string;
  created_at: string | null;
  user_id?: string | null;
}

export default function MyReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const response = await getUserReviews();
        if (response?.data?.reviews) {
          setReviews(response.data.reviews);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load your reviews. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [user]);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Helper function to render stars based on rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 ${i < rating ? 'text-amber-500' : 'text-gray-300'}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <p className="text-center text-gray-600">
              Please <Link href="/auth/login" className="text-amber-600 hover:text-amber-500">log in</Link> to view your reviews.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              My Reviews
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
            <p className="text-gray-500 mb-4">You haven't written any reviews yet.</p>
            <Link href="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700">
              Explore Cafes
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {reviews.map((review) => (
                <li key={review.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <Link href={`/cafes/${review.cafe_id || ''}`} className="text-lg font-medium text-amber-600 truncate hover:underline">
                        {review.cafe_name}
                      </Link>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                          {formatDate(review.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <div className="sm:flex">
                        <div className="mr-6 flex items-center text-sm text-gray-500">
                          {renderStars(review.rating || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-700 line-clamp-3">{review.content}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
  );
}
