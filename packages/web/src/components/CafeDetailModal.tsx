import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CafeReviews } from './CafeReviews';
import { CafeOpeningHours } from './CafeOpeningHours';
import { PopularTimesChart } from './PopularTimesChart';
import { ReviewForm } from './ReviewForm';
import { useAuth } from '@/contexts/AuthContext';

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
  place_id?: string | null;
  business_hours?: any;
  realtime?: {
    wifi_speed?: number | null;
    noise_level?: number | null;
    seating_availability?: number | null;
  };
  popular_times?: any;
}

interface CafeDetailModalProps {
  cafe: ExtendedCafe;
  isOpen: boolean;
  onClose: () => void;
  formatRating: (rating: number | null | undefined) => string;
  hasReviews: (cafe: any) => boolean;
  getScoreValue: (cafe: any, scoreField: string) => number;
}

export function CafeDetailModal({ 
  cafe, 
  isOpen, 
  onClose, 
  formatRating, 
  hasReviews, 
  getScoreValue 
}: CafeDetailModalProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { user } = useAuth();

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
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          className="absolute top-4 right-4 z-10 bg-white bg-opacity-70 rounded-full p-2 hover:bg-opacity-100 transition-all duration-200"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Cafe Image */}
        <div 
          className="h-64 bg-cover bg-center" 
          style={{ 
            backgroundImage: `url(${cafe.image_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'})`
          }}
        ></div>

        <div className="p-6">
          {/* Cafe Name and Overall Rating */}
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex-grow">
              {cafe.name}
            </h2>
            <div className="flex items-center bg-amber-50 px-3 py-1.5 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-base font-medium text-amber-700">
                {hasReviews(cafe) ? formatRating(cafe.average_rating) : "N/A"}
              </span>
              {(cafe.review_count ?? 0) > 0 && (
                <span className="text-amber-500 text-sm ml-1">
                  ({cafe.review_count})
                </span>
              )}
            </div>
          </div>

          {/* Address */}
          <p className="text-gray-600 mb-4">
            {cafe.address}
          </p>

          {/* Opening Hours */}
          <div className="mb-6">
            <CafeOpeningHours name={cafe.name} placeId={cafe.place_id} businessHours={cafe.business_hours} />
          </div>
          
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Grindability Score */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">Grindability</span>
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
            <div className="bg-pink-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-pink-700">Vibe</span>
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
            
            {/* Coffee Quality Score */}
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-700">Coffee Quality</span>
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
            
            {/* Student-Friendliness Score */}
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">Friendliness</span>
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

          {/* Amenities */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-6">
            {cafe.realtime?.wifi_speed && (
              <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span className="capitalize">WiFi: {cafe.realtime.wifi_speed}Mbps</span>
              </div>
            )}
            {cafe.realtime?.noise_level && (
              <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span className="capitalize">Noise: {cafe.realtime.noise_level}/10</span>
              </div>
            )}
            {cafe.realtime?.seating_availability && (
              <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <span className="capitalize">Seating: {cafe.realtime.seating_availability}/10</span>
              </div>
            )}
          </div>

          {/* Popular Times Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Popular Times</h3>
            <PopularTimesChart 
              data={cafe.popular_times || null} 
            />
          </div>

          {/* Reviews Section */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Reviews
              </h3>
              
              {user && !showReviewForm && (
                <button 
                  onClick={() => setShowReviewForm(true)}
                  className="flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-800 px-3 py-1.5 border border-amber-300 rounded-full hover:bg-amber-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Write a Review
                </button>
              )}
            </div>
            
            {showReviewForm && (
              <div className="mb-6 p-4 rounded-lg">
                <ReviewForm 
                  cafeId={cafe.id} 
                  onSuccess={() => {
                    setShowReviewForm(false);
                    // Force refresh by remounting the CafeReviews component
                    const reviewsSection = document.getElementById('cafe-reviews-section');
                    if (reviewsSection) {
                      reviewsSection.classList.add('animate-pulse');
                      setTimeout(() => {
                        reviewsSection.classList.remove('animate-pulse');
                      }, 500);
                    }
                  }}
                  onCancel={() => setShowReviewForm(false)}
                />
              </div>
            )}
            
            <div id="cafe-reviews-section">
              <CafeReviews cafeId={cafe.id} showAll={true} hideToggle={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
