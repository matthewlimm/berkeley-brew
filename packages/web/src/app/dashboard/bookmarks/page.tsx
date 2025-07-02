'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useBookmarks } from '@/contexts/BookmarkContext'
import Link from 'next/link'
import Image from 'next/image'
import { CafeOpeningHours } from '@/components/CafeOpeningHours'
import { CafeDetailModal } from '@/components/CafeDetailModal'

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
    wifi_speed?: number
    realtime?: {
      wifi_speed?: number
      noise_level?: number
      seating_availability?: number
    }
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
  return cafe && cafe[scoreField] !== null && cafe[scoreField] !== undefined && !isNaN(Number(cafe[scoreField]))
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

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [error, setError] = useState<string | null>(null)
  const [modalCafeId, setModalCafeId] = useState<string | null>(null)
  const { user } = useAuth()
  const { refreshBookmarks, isLoading: bookmarkLoading } = useBookmarks()
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

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
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Bookmarks</h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage your bookmarked cafes and favorite spots
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              {/* Cafe Image */}
              <div className="relative h-48 w-full cursor-pointer" onClick={() => setModalCafeId(bookmark.cafes.id)}>
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
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {bookmark.cafes.name}
                  </h3>
                  <div className="flex items-center bg-amber-50 px-2 py-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-medium text-amber-700">
{hasReviews(bookmark.cafes) ? formatRating(bookmark.cafes.average_rating) : "N/A"}
                    </span>
                    {(bookmark.cafes.review_count ?? 0) > 0 && (
                      <span className="text-amber-500 text-xs ml-1">
                        ({bookmark.cafes.review_count})
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Opening Hours */}
                <div className="mb-4">
                  <CafeOpeningHours 
                    businessHours={bookmark.cafes.business_hours || {}} 
                    className="text-sm text-gray-600"
                  />
                </div>
                
                {/* Metrics - using homepage logic */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Grindability Score */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">Grindability</span>
                      <span className="text-sm font-bold text-blue-700">
                        {getScoreValue(bookmark.cafes, 'grindability_score') > 0 ? formatRating(getScoreValue(bookmark.cafes, 'grindability_score')) : "N/A"}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-1.5">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${getScoreValue(bookmark.cafes, 'grindability_score') * 20}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Vibe Score */}
                  <div className="bg-pink-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-pink-700">Vibe</span>
                      <span className="text-sm font-bold text-pink-700">
                        {getScoreValue(bookmark.cafes, 'vibe_score') > 0 ? formatRating(getScoreValue(bookmark.cafes, 'vibe_score')) : "N/A"}
                      </span>
                    </div>
                    <div className="w-full bg-pink-200 rounded-full h-2 mt-1.5">
                      <div 
                        className="bg-pink-600 h-2 rounded-full" 
                        style={{ width: `${getScoreValue(bookmark.cafes, 'vibe_score') * 20}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Coffee Quality Score */}
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-700">Coffee Quality</span>
                      <span className="text-sm font-bold text-purple-700">
                        {getScoreValue(bookmark.cafes, 'coffee_quality_score') > 0 ? formatRating(getScoreValue(bookmark.cafes, 'coffee_quality_score')) : "N/A"}
                      </span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2 mt-1.5">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${getScoreValue(bookmark.cafes, 'coffee_quality_score') * 20}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Student-Friendliness Score */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700">Friendliness</span>
                      <span className="text-sm font-bold text-green-700">
                        {getScoreValue(bookmark.cafes, 'student_friendliness_score') > 0 ? formatRating(getScoreValue(bookmark.cafes, 'student_friendliness_score')) : "N/A"}
                      </span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2 mt-1.5">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${getScoreValue(bookmark.cafes, 'student_friendliness_score') * 20}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
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
            // Convert wifi_speed from string to number if needed
            realtime: bookmarks.find(b => b.cafes.id === modalCafeId)?.cafes.realtime ? {
              wifi_speed: bookmarks.find(b => b.cafes.id === modalCafeId)?.cafes.realtime?.wifi_speed ? 
                Number(bookmarks.find(b => b.cafes.id === modalCafeId)?.cafes.realtime?.wifi_speed) : null,
              noise_level: null,
              seating_availability: null
            } : undefined
          }}
          isOpen={!!modalCafeId}
          onClose={() => setModalCafeId(null)}
          formatRating={formatRating}
          hasReviews={hasReviews}
          getScoreValue={getScoreValue}
        />
      )}
    </div>
  )
}
