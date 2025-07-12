'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useBookmarks } from '@/contexts/BookmarkContext'
import Link from 'next/link'
import Image from 'next/image'
import { CafeOpeningHours } from '@/components/CafeOpeningHours'
import { CafeDetailModal } from '@/components/CafeDetailModal'
import { PopularTimesChart } from '@/components/PopularTimesChart'
import BookmarkButton from '@/components/BookmarkButton'

interface Bookmark {
  id: string
  cafe_id: string
  user_id: string
  created_at: string
  cafes: {
    id: string
    name: string
    address: string
    image_url?: string
    average_rating?: number
    review_count?: number
    grindability_score?: number
    vibe_score?: number
    coffee_quality_score?: number
    student_friendliness_score?: number
    business_hours?: any
    price_category?: "$" | "$$" | "$$$" | null
    latitude?: number
    longitude?: number
    place_id?: string
    popular_times?: any
    reviews?: any[]
  }
}

// Helper function to format rating display - matches homepage logic
const formatRating = (rating: number | null | undefined): string => {
  if (rating === null || rating === undefined || isNaN(Number(rating))) return "N/A"
  return Number(rating).toFixed(1)
}

// Helper function to check if a cafe has reviews - matches homepage logic
const hasReviews = (cafe: any): boolean => {
  // Check if the cafe has a review_count greater than 0 and has a valid average_rating
  return (cafe.review_count && cafe.review_count > 0) && 
    (typeof cafe.average_rating === 'number' && cafe.average_rating > 0);
}

// Helper function to check if a cafe has an overall rating
const hasOverallRating = (cafe: any): boolean => {
  return cafe && cafe.average_rating !== null && cafe.average_rating !== undefined && !isNaN(Number(cafe.average_rating))
}

// Helper function to check if a specific score exists
const hasScore = (cafe: any, scoreField: string): boolean => {
  return cafe && typeof cafe[scoreField] === 'number' && !isNaN(cafe[scoreField]) && cafe[scoreField] > 0;
}

// Helper function to get the score value - matches homepage logic
const getScoreValue = (cafe: any, scoreField: string): number => {
  // Don't show any scores if there are no reviews
  if (!hasReviews(cafe)) {
    return 0;
  }
  
  // First try to use pre-calculated scores from backend
  const score = cafe[scoreField]
  if (score !== null && score !== undefined && !isNaN(Number(score))) {
    return Number(score)
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
        .filter((score: any) => score !== null && score !== undefined && !isNaN(Number(score)));
        
      if (validScores.length > 0) {
        return validScores.reduce((sum: number, score: any) => sum + Number(score), 0) / validScores.length;
      }
    }
  }
  
  // Default to 0 if no valid score found
  return 0;
}

// Haversine distance calculation function (same as homepage)
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371e3; // Earth's radius in meters
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [error, setError] = useState<string | null>(null)
  const [modalCafeId, setModalCafeId] = useState<string | null>(null)
  const { user } = useAuth()
  const { refreshBookmarks, isLoading: bookmarkLoading } = useBookmarks()
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)

  // Function to handle review changes (edit/delete) and update cafe metrics
  const handleReviewChange = async (reviewData: any) => {
    console.log('Review changed in bookmarks page:', reviewData);
    
    // Refresh bookmarks data to update metrics
    try {
      setIsLoading(true);
      const { apiService } = await import('@/services/apiService');
      
      // Get bookmarks with reviews included for proper score calculation
      const response = await apiService.get('/bookmarks?includeReviews=true');
      
      if (Array.isArray(response)) {
        setBookmarks(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setBookmarks(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh bookmarks data after review change:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Error getting location:', error.message);
        }
      );
    }
  }, []);

  useEffect(() => {
    const fetchBookmarkDetails = async () => {
      if (!user) {
        setBookmarks([])
        return
      }
      
      if (hasLoaded) return
      
      try {
        setIsLoading(true)
        setHasLoaded(true)
        const { apiService } = await import('@/services/apiService')
        
        // Get bookmarks with reviews included for proper score calculation
        const response = await apiService.get('/bookmarks?includeReviews=true')
        
        if (Array.isArray(response)) {
          setBookmarks(response)
        } else if (response && response.data && Array.isArray(response.data)) {
          setBookmarks(response.data)
        } else {
          setBookmarks([])
        }
        setError(null)
      } catch (err) {
        console.error('Error fetching bookmarks:', err)
        setError('Failed to load bookmarks. Please try again later.')
        setBookmarks([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchBookmarkDetails()
  }, [user, hasLoaded]) // Only depend on user and hasLoaded, not on refreshBookmarks

  // Handle removing a bookmark
  const handleRemoveBookmark = async (cafeId: string) => {
    try {
      setIsLoading(true)
      // Import the apiService directly to avoid circular dependencies
      const { apiService } = await import('@/services/apiService')
      
      // Call the API to remove the bookmark
      await apiService.delete(`/bookmarks/${cafeId}`)
      
      // Update local state by removing the bookmark
      setBookmarks(prev => prev.filter(bookmark => bookmark.cafe_id !== cafeId))
      
      // Also refresh the bookmarks context
      refreshBookmarks()
    } catch (err) {
      console.error('Error removing bookmark:', err)
      setError('Failed to remove bookmark. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // We already have a formatRating function defined at the top level

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="pb-6 border-b border-gray-200 mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Bookmarks</h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage your bookmarked cafes and favorite spots
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-14 w-14 border-t-3 border-b-3 border-amber-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      ) : !bookmarks || bookmarks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">You haven't bookmarked any cafes yet.</p>
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            Explore Cafes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
            >
              {/* Cafe Image */}
              <div className="relative h-52 w-full cursor-pointer hover:opacity-95 transition-opacity" onClick={() => setModalCafeId(bookmark.cafes.id)}>
                {bookmark.cafes.image_url ? (
                  <Image
                    src={bookmark.cafes.image_url}
                    alt={bookmark.cafes.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}
                
                {/* Remove bookmark button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening modal when clicking remove button
                    handleRemoveBookmark(bookmark.cafes.id);
                  }}
                  className="absolute top-4 right-4 z-10 bg-white bg-opacity-70 rounded-full p-2 hover:bg-opacity-100 transition-all duration-200"
                  aria-label="Remove bookmark"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5">
                {/* Cafe Name and Overall Rating */}
                <div className="flex justify-between items-center mb-3"> {/* Changed from items-start to items-center */}
                  <div className="flex items-center max-w-[50%] gap-3"> {/* Reduced max width for more aggressive truncation */}
                    <h3 className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-amber-600 transition-colors truncate"
                      onClick={() => setModalCafeId(bookmark.cafes.id)}
                      title={bookmark.cafes.name} /* Show full name on hover */
                    >
                      {bookmark.cafes.name}
                    </h3>
                    <BookmarkButton key={`bookmark-${bookmark.cafes.id}`} cafeId={bookmark.cafes.id} size="md" />
                  </div>
                  <div className="flex items-center gap-3">
                    {bookmark.cafes.price_category && (
                      <span className="bg-green-100 text-green-800 font-medium text-xs px-2.5 py-1.5 rounded-full border border-green-200">
                        {bookmark.cafes.price_category}
                      </span>
                    )}
                    <div className="flex items-center bg-amber-50 px-2.5 py-1.5 rounded-full shadow-sm border border-amber-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-medium text-amber-700">
                        {hasReviews(bookmark.cafes) ? formatRating(bookmark.cafes.average_rating) : "N/A"}
                      </span>
                      {(bookmark.cafes.review_count ?? 0) > 0 && (
                        <span className="text-amber-500 text-xs ml-1.5">
                          ({bookmark.cafes.review_count})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Address and Distance */}
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-gray-600 text-sm">
                      {(() => {
                        // Try to extract just street address and city
                        if (bookmark.cafes.address) {
                          // Typical US format: "123 Main St, Berkeley, CA 94704"
                          const parts = bookmark.cafes.address.split(',');
                          if (parts.length >= 2) {
                            return parts[0].trim() + ', ' + parts[1].trim();
                          } else {
                            return bookmark.cafes.address;
                          }
                        }
                        return '';
                      })()}
                    </p>
                    {userLocation && bookmark.cafes.latitude && bookmark.cafes.longitude && !isNaN(Number(bookmark.cafes.latitude)) && !isNaN(Number(bookmark.cafes.longitude)) && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100">
                        {(() => {
                          const distMeters = haversineDistance(userLocation.lat, userLocation.lng, Number(bookmark.cafes.latitude), Number(bookmark.cafes.longitude));
                          const metersPerMile = 1609.34;
                          const metersPerFoot = 0.3048;
                          const distMiles = distMeters / metersPerMile;
                          if (distMiles < 0.1) {
                            // Show feet
                            const distFeet = distMeters / metersPerFoot;
                            return `${Math.round(distFeet)} ft`;
                          } else {
                            // Show miles
                            return `${distMiles.toFixed(2)} mi`;
                          }
                        })()}
                      </span>
                    )}
                  </div>
                  {/* Price Category moved next to rating */}
                </div>
                
                {/* Opening Hours */}
                <div className="mb-2 text-sm text-gray-600">
                  <CafeOpeningHours 
                    name={bookmark.cafes.name}
                    businessHours={bookmark.cafes.business_hours || {}} 
                  />
                </div>
                
                {/* Metrics - with increased spacing from opening hours */}
                <div className="mt-6 grid grid-cols-2 gap-3 mb-4">
                  {/* Grindability Score */}
                  <div className="bg-blue-50 p-3 rounded-lg shadow-sm border border-blue-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">Grindability</span>
                      <span className="text-sm font-bold text-blue-700">
                        {hasScore(bookmark.cafes, 'grindability_score') ? formatRating(getScoreValue(bookmark.cafes, 'grindability_score')) : "N/A"}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-1.5">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: hasScore(bookmark.cafes, 'grindability_score') ? `${getScoreValue(bookmark.cafes, 'grindability_score') * 20}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Vibe Score */}
                  <div className="bg-pink-50 p-3 rounded-lg shadow-sm border border-pink-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-pink-700">Vibe</span>
                      <span className="text-sm font-bold text-pink-700">
                        {hasScore(bookmark.cafes, 'vibe_score') ? formatRating(getScoreValue(bookmark.cafes, 'vibe_score')) : "N/A"}
                      </span>
                    </div>
                    <div className="w-full bg-pink-200 rounded-full h-2 mt-1.5">
                      <div 
                        className="bg-pink-600 h-2 rounded-full" 
                        style={{ width: hasScore(bookmark.cafes, 'vibe_score') ? `${getScoreValue(bookmark.cafes, 'vibe_score') * 20}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Coffee Quality Score */}
                  <div className="bg-amber-50 p-3 rounded-lg shadow-sm border border-amber-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-700">Coffee</span>
                      <span className="text-sm font-bold text-amber-700">
                        {hasScore(bookmark.cafes, 'coffee_quality_score') ? formatRating(getScoreValue(bookmark.cafes, 'coffee_quality_score')) : "N/A"}
                      </span>
                    </div>
                    <div className="w-full bg-amber-200 rounded-full h-2 mt-1.5">
                      <div 
                        className="bg-amber-600 h-2 rounded-full" 
                        style={{ width: hasScore(bookmark.cafes, 'coffee_quality_score') ? `${getScoreValue(bookmark.cafes, 'coffee_quality_score') * 20}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Student Friendliness Score */}
                  <div className="bg-green-50 p-3 rounded-lg shadow-sm border border-green-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700">Friendliness</span>
                      <span className="text-sm font-bold text-green-700">
                        {hasScore(bookmark.cafes, 'student_friendliness_score') ? formatRating(getScoreValue(bookmark.cafes, 'student_friendliness_score')) : "N/A"}
                      </span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2 mt-1.5">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: hasScore(bookmark.cafes, 'student_friendliness_score') ? `${getScoreValue(bookmark.cafes, 'student_friendliness_score') * 20}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Popular Times Chart - moved after metrics */}
                {bookmark.cafes.popular_times && (
                  <div className="mt-6 mb-10"> {/* Increased bottom margin from mb-4 to mb-10 */}
                    <PopularTimesChart data={bookmark.cafes.popular_times} />
                  </div>
                )}
                
                <button
                  onClick={() => setModalCafeId(bookmark.cafes.id)}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cafe Detail Modal */}
      {modalCafeId && bookmarks.find(b => b.cafes.id === modalCafeId) && (
        <CafeDetailModal 
          cafe={{
            ...bookmarks.find(b => b.cafes.id === modalCafeId)!.cafes,
            image_url: bookmarks.find(b => b.cafes.id === modalCafeId)?.cafes.image_url || undefined,
            // Explicitly set user_has_reviewed flag
            user_has_reviewed: !!(user && bookmarks.some(b => 
              b.cafes.id === modalCafeId && 
              b.cafes.reviews && 
              Array.isArray(b.cafes.reviews) && 
              b.cafes.reviews.some(review => review && review.user_id === user.id)
            ))
          }}
          isOpen={!!modalCafeId}
          onClose={() => setModalCafeId(null)}
          formatRating={formatRating}
          hasReviews={hasReviews}
          getScoreValue={getScoreValue}
          onReviewChange={handleReviewChange}
        />
      )}
    </div>
  )
}
