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
  place_id?: string | null;
  business_hours?: any;
  price_category?: "$" | "$$" | "$$$" | null;

  popular_times?: any;
}

interface CafeDetailModalProps {
  cafe: ExtendedCafe;
  isOpen: boolean;
  onClose: () => void;
  formatRating: (rating: number | null | undefined) => string;
  hasReviews: (cafe: any) => boolean;
  getScoreValue: (cafe: any, scoreField: string) => number;
  onReviewSubmit?: () => void;
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
  onReviewSubmit 
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
          {/* Cafe Name, Bookmark Button, and Overall Rating */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold text-gray-900 pr-2">{cafe.name}</h2>
              <BookmarkButton cafeId={cafe.id} size="lg" />  
            </div>
            <div className="flex items-center gap-2">
              {cafe.price_category && (
                <span className="bg-green-100 text-green-800 font-medium text-sm px-2.5 py-1.5 rounded-full border border-green-200">
                  {cafe.price_category}
                </span>
              )}
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
          </div>

          {/* Address */}
          <div className="mb-4">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Grindability Score */}
            <div className="bg-blue-50 p-3 rounded-lg">
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
            <div className="bg-pink-50 p-3 rounded-lg">
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
            
            {/* Coffee Quality Score */}
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-purple-700">Coffee Quality</span>
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
            
            {/* Student-Friendliness Score */}
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-green-700">Student-Friendly</span>
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
