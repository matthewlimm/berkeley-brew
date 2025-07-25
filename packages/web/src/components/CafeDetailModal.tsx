import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import Image from 'next/image';
import { CafeReviews } from './CafeReviews';
import { CafeOpeningHours } from './CafeOpeningHours';
import { PopularTimesChart } from './PopularTimesChart';
import { ReviewForm } from './ReviewForm';
import { useAuth } from '@/contexts/AuthContext';
import BookmarkButton from './BookmarkButton';

// Extended cafe type to include API response fields
interface ExtendedCafe {
  id: string;
  name: string;
  address?: string;
  image_url?: string;
  average_rating?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  review_count?: number | null;
  reviews?: any[];
  user_reviews?: any[]; // Some pages use this structure
  user_has_reviewed?: boolean; // Some pages have a direct flag
  place_id?: string | null;
  business_hours?: any;
  price_category?: "$" | "$$" | "$$$" | null;

  popular_times?: any;
  
  // Metrics
  grindability_score?: number | null;
  student_friendliness_score?: number | null;
  coffee_quality_score?: number | null;
  vibe_score?: number | null;
}

interface CafeDetailModalProps {
  cafe: ExtendedCafe;
  isOpen: boolean;
  onClose: () => void;
  formatRating: (rating: number | null | undefined) => string;
  hasReviews: (cafe: any) => boolean;
  getScoreValue: (cafe: any, scoreField: string) => number;
  onReviewSubmit?: () => void;
  onReviewChange?: (reviewData: any) => void;
  onBookmarkChange?: (cafeId: string, isBookmarked: boolean) => void;
}

interface TooltipProps {
  content: string;
  isVisible: boolean;
  iconRef: React.RefObject<SVGSVGElement>;
}

// Tooltip component that uses React Portal
const Tooltip = ({ content, isVisible, iconRef }: TooltipProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  useEffect(() => {
    if (iconRef.current && isVisible) {
      const rect = iconRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top,
        left: rect.right
      });
    }
  }, [isVisible, iconRef]);

  if (!isVisible) return null;

  return ReactDOM.createPortal(
    <div 
      className="w-64 bg-white p-2 rounded shadow-lg text-xs text-gray-700 border border-gray-200 z-[9999]"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateY(-100%)',
      }}
    >
      {content}
    </div>,
    document.body
  );
};

// Tooltip components for each rating category
const GrindabilityTooltip = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const iconRef = useRef<SVGSVGElement>(null);
  
  return (
    <div className="inline-block ml-1 relative">
      <svg 
        ref={iconRef}
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4 text-blue-500 cursor-help" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <Tooltip 
        content="How suitable the cafe is for studying or working. Considers factors like available seating, outlet access, WiFi quality, and noise level."
        isVisible={showTooltip}
        iconRef={iconRef}
      />
    </div>
  );
};

const VibeTooltip = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const iconRef = useRef<SVGSVGElement>(null);
  
  return (
    <div className="inline-block ml-1 relative">
      <svg 
        ref={iconRef}
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4 text-pink-500 cursor-help" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <Tooltip 
        content="The overall atmosphere and ambiance of the cafe. Includes decor, music, lighting, and the general feeling or energy of the space."
        isVisible={showTooltip}
        iconRef={iconRef}
      />
    </div>
  );
};

const CoffeeQualityTooltip = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const iconRef = useRef<SVGSVGElement>(null);
  
  return (
    <div className="inline-block ml-1 relative">
      <svg 
        ref={iconRef}
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4 text-purple-500 cursor-help" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <Tooltip 
        content="The taste, freshness, and overall quality of coffee and espresso drinks. Considers flavor profile, consistency, and variety of coffee options available."
        isVisible={showTooltip}
        iconRef={iconRef}
      />
    </div>
  );
};

const StudentFriendlyTooltip = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const iconRef = useRef<SVGSVGElement>(null);
  
  return (
    <div className="inline-block ml-1 relative">
      <svg 
        ref={iconRef}
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4 text-green-500 cursor-help" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <Tooltip 
        content="How welcoming the cafe is to students. Includes staff friendliness, policies on laptop use, time limits for seating, and overall attitude toward student customers."
        isVisible={showTooltip}
        iconRef={iconRef}
      />
    </div>
  );
};

export function CafeDetailModal({ 
  cafe, 
  isOpen, 
  onClose, 
  formatRating, 
  hasReviews, 
  getScoreValue,
  onReviewSubmit,
  onReviewChange,
  onBookmarkChange
}: CafeDetailModalProps) {
  // Create a ref to access the CafeReviews component
  const cafeReviewsRef = useRef<any>(null);
  
  // Add a refreshCafeData function to handle all review actions
  const refreshCafeData = (reviewData?: any) => {
    console.log('Refreshing cafe data for metrics update', reviewData);
    
    // Call onReviewChange callback if provided to refresh cafe data
    if (onReviewChange) {
      onReviewChange(reviewData || { action: 'refresh', cafeId: cafe.id });
    }
    
    // For backward compatibility, also call onReviewSubmit if provided
    if (onReviewSubmit) {
      onReviewSubmit();
    }
    
    // Force refresh by adding animation to the reviews section
    const reviewsSection = document.getElementById('cafe-reviews-section');
    if (reviewsSection) {
      reviewsSection.classList.add('animate-pulse');
      setTimeout(() => {
        reviewsSection.classList.remove('animate-pulse');
      }, 500);
    }
  };
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { user } = useAuth();
  
  // State to track if user has reviewed this cafe (dynamically updated)
  const [hasUserReviewedCafe, setHasUserReviewedCafe] = useState(false);

  // Check reviews status dynamically by accessing the CafeReviews component's state
  const checkUserReviewStatus = React.useCallback(async () => {
    if (!user) {
      setHasUserReviewedCafe(false);
      return;
    }

    console.log('CafeDetailModal - Checking review status for:', {
      cafeId: cafe.id,
      cafeName: cafe.name,
      userId: user?.id
    });

    // Check for user_has_reviewed flag (explicitly set by parent component)
    if (cafe.user_has_reviewed === true) {
      console.log('Modal: User has reviewed via user_has_reviewed flag');
      setHasUserReviewedCafe(true);
      return;
    }

    // Check reviews array if it exists
    if (cafe.reviews && Array.isArray(cafe.reviews)) {
      const hasReviewed = cafe.reviews.some(review => review && review.user_id === user.id);
      if (hasReviewed) {
        console.log('Modal: User has reviewed via reviews array');
        setHasUserReviewedCafe(true);
        return;
      }
    }

    // Check user_reviews array if it exists
    if (cafe.user_reviews && Array.isArray(cafe.user_reviews)) {
      const hasReviewed = cafe.user_reviews.some(review => review && review.user_id === user.id);
      if (hasReviewed) {
        console.log('Modal: User has reviewed via user_reviews array');
        setHasUserReviewedCafe(true);
        return;
      }
    }

    // If no review found, try to get fresh data from the API
    try {
      const { getCafe } = await import('../services/api');
      const response = await getCafe(cafe.id);
      const freshReviews = response.data?.cafe.reviews || [];
      
      const hasReviewed = freshReviews.some((review: any) => review && review.user_id === user.id);
      console.log('Modal: Fresh API check - User has reviewed:', hasReviewed);
      setHasUserReviewedCafe(hasReviewed);
    } catch (error) {
      console.error('Error checking fresh review status:', error);
      setHasUserReviewedCafe(false);
    }
  }, [user, cafe]);

  // Check review status when modal opens or user/cafe changes
  useEffect(() => {
    if (isOpen) {
      checkUserReviewStatus();
    }
  }, [isOpen, checkUserReviewStatus]);

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      // Re-enable body scrolling when modal is closed
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          className="absolute top-4 right-4 z-10 bg-white bg-opacity-80 rounded-full p-2.5 hover:bg-opacity-100 transition-all duration-200 shadow-md"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Cafe Image */}
        <div 
          className="h-72 bg-cover bg-center" 
          style={{ 
            backgroundImage: `url(${cafe.image_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'})`
          }}
        ></div>

        <div className="p-8">
          {/* Cafe Name, Bookmark Button, and Overall Rating */}
          <div className="flex justify-between items-center mb-6"> {/* Changed from items-start to items-center */}
            <div className="flex items-center gap-4"> {/* Increased gap between title and bookmark */}
              <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">{cafe.name}</h2>
              <BookmarkButton cafeId={cafe.id} size="lg" onBookmarkChange={onBookmarkChange} />
            </div>
            <div className="flex items-center text-gray-700 gap-4"> {/* Added gap between price and rating */}
              {cafe.price_category && (
                <div className="flex items-center bg-green-100 text-green-800 font-medium text-sm px-2 py-1 rounded border border-green-200">
                  {cafe.price_category}
                </div>
              )}
              <div className="flex items-center bg-amber-50 px-2 py-1 rounded shadow-sm border border-amber-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-base font-medium text-amber-700">
                  {hasReviews(cafe) ? formatRating(cafe.average_rating) : "N/A"}
                </span>
                {(cafe.review_count ?? 0) > 0 && (
                  <span className="text-amber-500 text-sm ml-1.5">
                    ({cafe.review_count})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-5">
            <p className="text-gray-600">
              {cafe.address}
            </p>
            {/* Price Category moved next to rating */}
          </div>

          {/* Opening Hours */}
          <div className="mb-6">
            <CafeOpeningHours name={cafe.name} placeId={cafe.place_id} businessHours={cafe.business_hours} />
          </div>
          
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Grindability Score */}
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-blue-700">Grindability</span>
                  <GrindabilityTooltip />
                </div>
                <span className="text-sm font-bold text-blue-700">
                  {hasReviews(cafe) ? formatRating(getScoreValue(cafe, 'grindability_score')) : "N/A"}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-1.5">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: hasReviews(cafe) ? `${getScoreValue(cafe, 'grindability_score') * 20}%` : '0%' }}
                ></div>
              </div>
            </div>
            
            {/* Vibe Score */}
            <div className="bg-pink-50 p-4 rounded-lg shadow-sm border-2 border-pink-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-pink-700">Vibe</span>
                  <VibeTooltip />
                </div>
                <span className="text-sm font-bold text-pink-700">
                  {hasReviews(cafe) ? formatRating(getScoreValue(cafe, 'vibe_score')) : "N/A"}
                </span>
              </div>
              <div className="w-full bg-pink-200 rounded-full h-2 mt-1.5">
                <div 
                  className="bg-pink-600 h-2 rounded-full" 
                  style={{ width: hasReviews(cafe) ? `${getScoreValue(cafe, 'vibe_score') * 20}%` : '0%' }}
                ></div>
              </div>
            </div>
            
            {/* Coffee Score */}
            <div className="bg-purple-50 p-4 rounded-lg shadow-sm border-2 border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-purple-700">Coffee</span>
                  <CoffeeQualityTooltip />
                </div>
                <span className="text-sm font-bold text-purple-700">
                  {hasReviews(cafe) ? formatRating(getScoreValue(cafe, 'coffee_quality_score')) : "N/A"}
                </span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2 mt-1.5">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: hasReviews(cafe) ? `${getScoreValue(cafe, 'coffee_quality_score') * 20}%` : '0%' }}
                ></div>
              </div>
            </div>
            
            {/* Friendly Score */}
            <div className="bg-green-50 p-4 rounded-lg shadow-sm border-2 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-green-700">Friendly</span>
                  <StudentFriendlyTooltip />
                </div>
                <span className="text-sm font-bold text-green-700">
                  {hasReviews(cafe) ? formatRating(getScoreValue(cafe, 'student_friendliness_score')) : "N/A"}
                </span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2 mt-1.5">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: hasReviews(cafe) ? `${getScoreValue(cafe, 'student_friendliness_score') * 20}%` : '0%' }}
                ></div>
              </div>
            </div>
          </div>

          {/* Popular Times Section */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Popular Times</h3>
            <PopularTimesChart 
              data={cafe.popular_times || null} 
            />
          </div>

          {/* Reviews Section */}
          <div id="cafe-reviews-section" className="border-t border-gray-200 pt-8 mt-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800">Reviews</h3>
              {user && !showReviewForm && !hasUserReviewedCafe ? (
                <button 
                  onClick={() => setShowReviewForm(true)}
                  className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Write a Review
                </button>
              ) : user && !showReviewForm && hasUserReviewedCafe ? (
                <div className="text-sm text-gray-600 italic px-4 py-2 bg-gray-50 rounded-md border border-gray-200">
                  You've already reviewed this cafe
                </div>
              ) : null}
            </div>
            
            {showReviewForm && (
              <div className="mb-6 p-4 rounded-lg">
                <ReviewForm 
                  cafeId={cafe.id} 
                  onSuccess={(reviewData) => {
                    setShowReviewForm(false);
                    
                    // Update local state immediately
                    setHasUserReviewedCafe(true);
                    
                    // Add the new review directly to the reviews list for immediate display
                    if (cafeReviewsRef.current && user) {
                      console.log('Review data from server:', reviewData);
                      
                      // Get the complete review data from the server
                      // First check if we have the complete review from the API response
                      const serverReview = reviewData.complete_review;
                      
                      if (serverReview && reviewData.id) {
                        // Format the review data to match the expected structure
                        const formattedReview = {
                          // Use the complete review data from the server
                          ...serverReview,
                          // Ensure we have the correct ID
                          id: reviewData.id,
                          // Include the complete user object with all necessary fields
                          user: {
                            id: user.id,
                            username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
                            email: user.email,
                            avatar_url: user.user_metadata?.avatar_url
                          },
                          // Use server timestamps if available, otherwise use current time
                          created_at: serverReview.created_at || new Date().toISOString(),
                          updated_at: serverReview.updated_at || new Date().toISOString()
                        };
                        
                        // Also update the avatarUrls map in the CafeReviews component
                        if (user.id && user.user_metadata?.avatar_url) {
                          cafeReviewsRef.current.updateAvatarUrl(user.id, user.user_metadata.avatar_url);
                        }
                        
                        console.log('Adding formatted review to UI:', formattedReview);
                        
                        // Add the review directly to the reviews list
                        cafeReviewsRef.current.addReview(formattedReview);
                        
                        console.log('Added review with ID:', reviewData.id);
                      } else {
                        console.error('Missing review ID or complete review data');
                      }
                    }
                    
                    // Use the refreshCafeData function to update metrics and home page state
                    refreshCafeData({ action: 'add', cafeId: cafe.id, userId: user?.id });
                  }}
                  onCancel={() => setShowReviewForm(false)}
                />
              </div>
            )}
            
            <div id="cafe-reviews-section">
              <CafeReviews 
                ref={cafeReviewsRef}
                cafeId={cafe.id} 
                showAll={true} 
                hideToggle={true} 
                onReviewChange={(reviewData) => {
                  // Use the refreshCafeData function to update metrics for all review actions
                  // Pass the review data to ensure proper refresh of cafe metrics
                  refreshCafeData(reviewData);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
