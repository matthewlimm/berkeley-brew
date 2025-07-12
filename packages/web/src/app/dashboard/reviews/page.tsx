'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { getUserReviews, updateReview, deleteReview, getCafe } from '@/services/api';
import { CafeDetailModal } from '@/components/CafeDetailModal';

interface Review {
  id: string;
  cafe_id: string | null;
  cafe_name: string;
  golden_bear_score: number | null;
  grindability_score: number | null;
  student_friendliness_score: number | null;
  coffee_quality_score: number | null;
  vibe_score: number | null;
  content: string;
  created_at: string | null;
  updated_at?: string | null;
  user_id?: string | null;
}

// Helper function to format rating display
const formatRating = (rating: number | null | undefined): string => {
  if (rating === null || rating === undefined || isNaN(Number(rating))) return "N/A"
  return Number(rating).toFixed(1)
}

// Helper function to check if a cafe has reviews
const hasReviews = (cafe: any): boolean => {
  // Check if the cafe has a review_count greater than 0 and has a valid average_rating
  return (cafe.review_count && cafe.review_count > 0) && 
    (typeof cafe.average_rating === 'number' && cafe.average_rating > 0);
}

// Helper function to check if a specific score exists
const hasScore = (cafe: any, scoreField: string): boolean => {
  return cafe && typeof cafe[scoreField] === 'number' && !isNaN(cafe[scoreField]) && cafe[scoreField] > 0;
}

// Helper function to get the score value
const getScoreValue = (cafe: any, scoreField: string): number => {
  // Don't show any scores if there are no reviews
  if (!hasReviews(cafe)) {
    return 0;
  }
  
  // First try to use pre-calculated scores from backend
  const score = cafe[scoreField];
  if (score !== null && score !== undefined && !isNaN(Number(score)) && Number(score) > 0) {
    return Number(score);
  }
  
  // Check if we have detailed review data with subscores
  if (cafe.reviews && cafe.reviews.length > 0) {
    // First check if we have the full review data with all subscores
    const hasDetailedScores = cafe.reviews.some((review: any) => 
      review[scoreField] !== undefined && review[scoreField] !== null
    );
    
    if (hasDetailedScores) {
      // Calculate average from all reviews with valid scores
      const validScores = cafe.reviews
        .map((review: any) => review[scoreField])
        .filter((score: any) => score !== null && score !== undefined && !isNaN(Number(score)) && Number(score) > 0);
        
      if (validScores.length > 0) {
        return validScores.reduce((sum: number, score: any) => sum + Number(score), 0) / validScores.length;
      }
    }
  }
  
  // Default to 0 if no valid score found
  return 0;
}

export default function MyReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  // Added state for CafeDetailModal
  const [modalCafeId, setModalCafeId] = useState<string | null>(null);
  const [selectedCafe, setSelectedCafe] = useState<any | null>(null);
  // Removed golden_bear_score as it's calculated on the backend
  const [editFormData, setEditFormData] = useState({
    content: '',
    grindability_score: 5,
    student_friendliness_score: 5,
    coffee_quality_score: 5,
    vibe_score: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [user]);
  
  // Effect to fetch cafe details when modalCafeId changes
  useEffect(() => {
    if (modalCafeId) {
      fetchCafeDetails(modalCafeId);
    } else {
      setSelectedCafe(null);
    }
  }, [modalCafeId]);
  
  useEffect(() => {
    if (isEditModalOpen || isDeleteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isEditModalOpen, isDeleteModalOpen]);

  const fetchReviews = async () => {
    if (!user) {
      console.log('No user found, skipping review fetch');
      return;
    }
    
    console.log('Fetching reviews for user:', user);
    
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      
      const response = await getUserReviews();
      console.log('Reviews response:', response);
      
      if (response?.data?.reviews) {
        console.log('Setting reviews:', response.data.reviews);
        setReviews(response.data.reviews);
      } else {
        console.warn('No reviews found in response:', response);
        setReviews([]);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load your reviews. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to fetch cafe details when a cafe is clicked
  const fetchCafeDetails = async (cafeId: string) => {
    try {
      setIsLoading(true);
      const response = await getCafe(cafeId);
      
      if (response?.data?.cafe) {
        setSelectedCafe(response.data.cafe);
      } else {
        console.warn('No cafe found in response:', response);
        setSelectedCafe(null);
        setModalCafeId(null);
      }
    } catch (err) {
      console.error('Error fetching cafe details:', err);
      setError('Failed to load cafe details. Please try again later.');
      setModalCafeId(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to handle review changes in the modal
  const handleReviewChange = async (reviewData: any) => {
    console.log('Review changed in reviews page:', reviewData);
    
    // Refresh reviews after a change
    await fetchReviews();
    
    // If we have a selected cafe, refresh its data to update metrics
    if (modalCafeId && selectedCafe) {
      try {
        const response = await getCafe(modalCafeId);
        
        if (response?.data?.cafe) {
          setSelectedCafe(response.data.cafe);
        }
      } catch (err) {
        console.error('Error refreshing cafe details after review change:', err);
      }
    }
  };
  
  const handleEditClick = (review: Review) => {
    setCurrentReview(review);
    setEditFormData({
      content: review.content,
      grindability_score: review.grindability_score || 5,
      student_friendliness_score: review.student_friendliness_score || 5,
      coffee_quality_score: review.coffee_quality_score || 5,
      vibe_score: review.vibe_score || 5
    });
    setIsEditModalOpen(true);
  };
  
  const handleDeleteClick = (review: Review) => {
    setCurrentReview(review);
    setIsDeleteModalOpen(true);
  };
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentReview) {
      console.error('No current review selected for editing');
      return;
    }
    
    console.log('Submitting edit for review:', currentReview.id);
    console.log('Edit form data:', editFormData);
    
    try {
      setIsSubmitting(true);
      setError(null); // Clear any previous errors
      
      console.log('Calling updateReview with ID:', currentReview.id);
      const response = await updateReview(currentReview.id, editFormData);
      console.log('Update review response:', response);
      
      setIsEditModalOpen(false);
      
      // Use handleReviewChange to refresh reviews and update metrics
      await handleReviewChange({
        action: 'edit',
        reviewId: currentReview.id,
        cafeId: currentReview.cafe_id
      });
    } catch (err) {
      console.error('Error updating review:', err);
      setError('Failed to update review. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!currentReview) {
      console.error('No current review selected for deletion');
      return;
    }
    
    console.log('Confirming deletion for review:', currentReview.id);
    
    try {
      setIsSubmitting(true);
      setError(null); // Clear any previous errors
      
      console.log('Calling deleteReview with ID:', currentReview.id);
      const response = await deleteReview(currentReview.id);
      console.log('Delete review response:', response);
      
      setIsDeleteModalOpen(false);
      
      // Use handleReviewChange to refresh reviews and update metrics
      await handleReviewChange({
        action: 'delete',
        reviewId: currentReview.id,
        cafeId: currentReview.cafe_id
      });
    } catch (err) {
      console.error('Error deleting review:', err);
      setError('Failed to delete review. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Helper function to format relative timestamp
  const formatRelativeTimestamp = (dateString: string, nowString: string): string => {
    const date = new Date(dateString);
    const now = new Date(nowString);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
  
  // Helper function to render rating input
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
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="pb-6 border-b border-gray-200 mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Reviews</h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage your reviews and ratings
        </p>
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
                      <button 
                        onClick={() => setModalCafeId(review.cafe_id || '')}
                        className="text-lg font-medium text-amber-600 truncate hover:underline text-left"
                      >
                        {review.cafe_name}
                      </button>
                      <div className="ml-2 flex-shrink-0 flex flex-col items-end gap-0.5">
  <span className="flex items-center gap-0.5 text-xs text-gray-500" title={review.created_at ? new Date(review.created_at).toLocaleString() : undefined}>
    <svg aria-label="Published" className="w-3 h-3 text-amber-400 mr-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"/></svg>
    <span>Published</span>
    <span className="ml-0.5">
      {review.created_at ? formatRelativeTimestamp(review.created_at, new Date().toISOString()) : 'Unknown date'}
    </span>
  </span>
  {review.updated_at && review.updated_at !== review.created_at && (
    <span className="flex items-center gap-0.5 text-xs text-gray-400" title={new Date(review.updated_at).toLocaleString()}>
      <svg aria-label="Edited" className="w-3 h-3 text-blue-300 mr-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.293-6.293a1 1 0 011.414 0l2.586 2.586a1 1 0 010 1.414L11 15H7v-4z"/></svg>
      <span>Edited</span>
      <span className="ml-0.5">
        {formatRelativeTimestamp(review.updated_at, new Date().toISOString())}
      </span>
    </span>
  )}
</div>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <div className="sm:flex">
                        <div className="mr-6 flex items-center text-sm text-gray-500">
                          {renderStars(review.golden_bear_score || 0)}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(review)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-amber-700 bg-amber-100 hover:bg-amber-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(review)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                        >
                          Delete
                        </button>
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
      
      {/* Edit Review Modal */}
      {isEditModalOpen && currentReview && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Review</h3>
            <form onSubmit={handleEditSubmit}>
              {/* Rating inputs - Overall Rating (golden_bear_score) is calculated on the backend */}
              <div className="mb-4">
                <p className="block text-sm font-medium text-gray-700">Golden Bear Score (Auto-calculated)</p>
                <div className="mt-1">
                  {renderStars(currentReview.golden_bear_score || 0)}
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
                  onClick={() => setIsEditModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && currentReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Review</h3>
            <p className="text-sm text-gray-500 mb-4">Are you sure you want to delete your review for {currentReview?.cafe_name}? This action cannot be undone.</p>
            
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Cafe Detail Modal */}
      {modalCafeId && selectedCafe && (
        <CafeDetailModal 
          cafe={selectedCafe}
          isOpen={!!modalCafeId}
          onClose={() => setModalCafeId(null)}
          formatRating={formatRating}
          hasReviews={hasReviews}
          getScoreValue={getScoreValue}
          onReviewChange={handleReviewChange}
        />
      )}
    </div>
  );
}
