'use client';

import { useState, useEffect } from "react";
import { getCafes } from "../services/api";
import { ReviewForm } from "../components/ReviewForm";
import { CafeReviews } from "../components/CafeReviews";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import HeroSectionWithRotatingBackground from "@/components/HeroSectionWithRotatingBackground";
import PopularTimesChart from "@/components/PopularTimesChart";
import type { Database } from "@berkeley-brew/api/src/types/database.types";

// Helper function to format rating display
function formatRating(rating: number | null | undefined): string {
  // Only return N/A if the rating is truly null/undefined or NaN
  if (rating === null || rating === undefined || isNaN(Number(rating))) return "N/A";
  // Always format as a number with one decimal place
  return Number(rating).toFixed(1);
}

// Helper function to check if a cafe has any reviews
function hasReviews(cafe: any): boolean {
  // Check if the cafe has a review_count greater than 0 and has a valid average_rating
  return (cafe.review_count && cafe.review_count > 0) && 
    (typeof cafe.average_rating === 'number' && cafe.average_rating > 0);
}

// Helper function to get the score value for a specific field
function getScoreValue(cafe: any, scoreField: string): number {
  // Don't show any scores if there are no reviews
  if (!hasReviews(cafe)) {
    return 0;
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
  
  // If we don't have detailed review data but the cafe has a valid average_rating,
  // use that for the Golden Bear Score and return 0 for subscores
  // This ensures consistency between the overall score and subscores
  if (scoreField === 'golden_bear_score' && typeof cafe.average_rating === 'number') {
    return Number(cafe.average_rating);
  }
  
  // Default to 0 if no valid score found
  return 0;
}

// Calculate Golden Bear score function
const calculateGoldenBearScore = (cafe: Database['public']['Tables']['cafes']['Row']) => {
  const scores = [
    cafe.grindability_score,
    cafe.student_friendliness_score,
    cafe.coffee_quality_score,
    cafe.vibe_score
  ].filter(score => score !== null && score !== undefined);
  
  return scores.length > 0 ? scores.reduce((sum, score) => sum + (score || 0), 0) / scores.length : null;
};

// Extended cafe type to include API response fields
type ExtendedCafe = Database['public']['Tables']['cafes']['Row'] & {
  average_rating?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  review_count?: number | null;
  reviews?: any[];
};

export default function Home() {
  const [cafes, setCafes] = useState<ExtendedCafe[]>([]);
  const [trendingCafes, setTrendingCafes] = useState<ExtendedCafe[]>([]);
  const [error, setError] = useState<string>();
  const [selectedCafeId, setSelectedCafeId] = useState<string | null>(null);
  const [expandedCafeId, setExpandedCafeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<
    'distance' | 'rating' | 'mostReviewed' | 'grindability' | 'vibe' | 'studentFriendliness' | 'coffeeQuality'
  >('distance');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { user } = useAuth();

  // Load cafes on mount
  useEffect(() => {
    setIsLoading(true);
    getCafes()
      .then((response) => {
        if (response?.data?.cafes) {
          const allCafes = response.data.cafes;
          setCafes(allCafes);
          
          // Using the calculateGoldenBearScore function defined at component scope
          
          // Get trending cafes (top 3 by Golden Bear score)
          const trendingCafes = allCafes
            .filter(cafe => {
              // At least one score must be present
              return cafe.grindability_score !== null || 
                     cafe.student_friendliness_score !== null || 
                     cafe.coffee_quality_score !== null || 
                     cafe.vibe_score !== null;
            })
            .sort((a, b) => {
              const scoreB = calculateGoldenBearScore(b) || 0;
              const scoreA = calculateGoldenBearScore(a) || 0;
              return scoreB - scoreA;
            })
            .slice(0, 3);
          setTrendingCafes(trendingCafes);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load cafes"))
      .finally(() => setIsLoading(false));
  }, []);

  // Ask for location if sorting by distance
  useEffect(() => {
    if (sortBy === 'distance' && !userLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => setUserLocation(null)
        );
      }
    }
  }, [sortBy, userLocation]);

  // Sorting logic
  let sortedCafes = [...cafes];
  function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371e3;
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  if (sortBy === 'distance' && userLocation) {
    sortedCafes.sort((a, b) => {
      const aLat = a.latitude != null ? Number(a.latitude) : null;
      const aLng = a.longitude != null ? Number(a.longitude) : null;
      const bLat = b.latitude != null ? Number(b.latitude) : null;
      const bLng = b.longitude != null ? Number(b.longitude) : null;
      if (aLat == null || aLng == null || bLat == null || bLng == null || isNaN(aLat) || isNaN(aLng) || isNaN(bLat) || isNaN(bLng)) return 0;
      const distA = haversineDistance(userLocation.lat, userLocation.lng, aLat, aLng);
      const distB = haversineDistance(userLocation.lat, userLocation.lng, bLat, bLng);
      return distA - distB;
    });
  } else if (sortBy === 'mostReviewed') {
    sortedCafes.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
  } else if (sortBy === 'grindability') {
    sortedCafes.sort((a, b) => {
      const aScore = getScoreValue(a, 'grindability_score');
      const bScore = getScoreValue(b, 'grindability_score');
      const aValid = typeof aScore === 'number' && !isNaN(aScore) && aScore > 0;
      const bValid = typeof bScore === 'number' && !isNaN(bScore) && bScore > 0;
      if (aValid && bValid) return bScore - aScore;
      if (aValid) return -1;
      if (bValid) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
    console.log('Sorted by grindability:', sortedCafes.map(c => ({ name: c.name, grindability_score: getScoreValue(c, 'grindability_score'), type: typeof getScoreValue(c, 'grindability_score') })));
  } else if (sortBy === 'vibe') {
    sortedCafes.sort((a, b) => {
      const aScore = getScoreValue(a, 'vibe_score');
      const bScore = getScoreValue(b, 'vibe_score');
      const aValid = typeof aScore === 'number' && !isNaN(aScore) && aScore > 0;
      const bValid = typeof bScore === 'number' && !isNaN(bScore) && bScore > 0;
      if (aValid && bValid) return bScore - aScore;
      if (aValid) return -1;
      if (bValid) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  } else if (sortBy === 'studentFriendliness') {
    sortedCafes.sort((a, b) => {
      const aScore = getScoreValue(a, 'student_friendliness_score');
      const bScore = getScoreValue(b, 'student_friendliness_score');
      const aValid = typeof aScore === 'number' && !isNaN(aScore) && aScore > 0;
      const bValid = typeof bScore === 'number' && !isNaN(bScore) && bScore > 0;
      if (aValid && bValid) return bScore - aScore;
      if (aValid) return -1;
      if (bValid) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  } else if (sortBy === 'coffeeQuality') {
    sortedCafes.sort((a, b) => {
      const aScore = getScoreValue(a, 'coffee_quality_score');
      const bScore = getScoreValue(b, 'coffee_quality_score');
      const aValid = typeof aScore === 'number' && !isNaN(aScore) && aScore > 0;
      const bValid = typeof bScore === 'number' && !isNaN(bScore) && bScore > 0;
      if (aValid && bValid) return bScore - aScore;
      if (aValid) return -1;
      if (bValid) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  } else {
    // Default: golden bear score or average_rating
    sortedCafes.sort((a, b) => (b.golden_bear_score || b.average_rating || 0) - (a.golden_bear_score || a.average_rating || 0));
  }

  const handleReviewSuccess = async (reviewData: { 
    grindability_score: number;
    student_friendliness_score: number;
    coffee_quality_score: number;
    vibe_score: number;
  }) => {
    // Immediately update the cafe with the new review data
    const cafeId = selectedCafeId;
    if (cafeId) {
      // First update the cafe in the local state
      setCafes(prevCafes => {
        return prevCafes.map(cafe => {
          if (cafe.id === cafeId) {
            // Calculate new scores based on existing reviews and the new review
            const reviewCount = (cafe.review_count || 0) + 1;
            
            // Calculate new average scores
            const updateScore = (currentScore: number | null, newScore: number) => {
              if (currentScore === null) return newScore;
              const totalScore = (currentScore * (reviewCount - 1)) + newScore;
              return totalScore / reviewCount;
            };
            
            // Calculate new scores
            const newGrindabilityScore = updateScore(cafe.grindability_score, reviewData.grindability_score);
            const newStudentFriendlinessScore = updateScore(cafe.student_friendliness_score, reviewData.student_friendliness_score);
            const newCoffeeQualityScore = updateScore(cafe.coffee_quality_score, reviewData.coffee_quality_score);
            const newVibeScore = updateScore(cafe.vibe_score, reviewData.vibe_score);
            
            // Calculate Golden Bear score (average of all subscores)
            const newGoldenBearScore = [
              newGrindabilityScore,
              newStudentFriendlinessScore,
              newCoffeeQualityScore,
              newVibeScore
            ].reduce((sum, score) => sum + score, 0) / 4;
            
            const updatedCafe = {
              ...cafe,
              review_count: reviewCount,
              grindability_score: newGrindabilityScore,
              student_friendliness_score: newStudentFriendlinessScore,
              coffee_quality_score: newCoffeeQualityScore,
              vibe_score: newVibeScore,
              golden_bear_score: newGoldenBearScore
            };
            
            return updatedCafe;
          }
          return cafe;
        });
      });
    }
    
    // Close the review form
    setSelectedCafeId(null);
    
    // Also fetch from server to ensure data consistency
    try {
      const response = await getCafes();
      if (response?.data?.cafes) {
        const allCafes = response.data.cafes;
        setCafes(allCafes);
        
        // Update trending cafes
        const sortedCafes = [...allCafes]
          .filter(cafe => {
            return cafe.grindability_score !== null || 
                   cafe.student_friendliness_score !== null || 
                   cafe.coffee_quality_score !== null || 
                   cafe.vibe_score !== null;
          })
          .sort((a, b) => {
            const scoreB = calculateGoldenBearScore(b) || 0;
            const scoreA = calculateGoldenBearScore(a) || 0;
            return scoreB - scoreA;
          })
          .slice(0, 4);
        setTrendingCafes(sortedCafes);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh cafes");
    }
  };

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-600">Error: {error}</p>
            <p className="text-red-500 mt-2">
              Make sure the backend server is running on port 3001
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Section with Rotating Background */}
      <HeroSectionWithRotatingBackground />


      {/* Trending Cafes Section - Commented out for now */}

      {/* All Cafes Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">

          <div className="mb-6 w-full">
            <div className="bg-white border border-amber-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
              <div className="flex flex-col">
                <label htmlFor="sort-dropdown" className="text-sm font-semibold text-amber-700 mb-1">Sort & Explore Cafes</label>
                <span className="text-xs text-gray-500">Choose how to order the list below.</span>
              </div>
              <div className="relative w-full sm:w-auto">
                <select
                  id="sort-dropdown"
                  className="border border-amber-400 rounded-lg px-4 py-2 text-sm bg-gradient-to-r from-amber-50 to-yellow-100 focus:ring-amber-400 focus:border-amber-500 shadow-sm transition-all duration-150 ease-in-out hover:border-amber-600 hover:bg-amber-100 appearance-none pr-10"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  style={{ minWidth: 180 }}
                >
                  <option value="distance">Closest</option>
                  <option value="rating">Highest Rated</option>
                  <option value="mostReviewed">Most Reviewed</option>
                  <option value="grindability">Grindability</option>
                  <option value="vibe">Vibe</option>
                  <option value="studentFriendliness">Student Friendliness</option>
                  <option value="coffeeQuality">Coffee Quality</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
              {sortBy === 'distance' && !userLocation && (
                <span className="text-xs text-red-500 ml-2">Allow location access to sort by distance</span>
              )}
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ gridAutoRows: "auto", gridAutoFlow: "row" }}>
            {sortedCafes.map((cafe) => (
              <div
                key={cafe.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col h-auto"
                style={{ breakInside: 'avoid', height: 'fit-content' }}
              >
                {/* Cafe Image */}
                <div 
                  className="h-48 bg-cover bg-center" 
                  style={{ 
                    backgroundImage: `url(${cafe.image_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'})`
                  }}
                ></div>
                
                <div className="p-5">
                  {/* Cafe Name and Overall Rating */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 flex-grow">
                      {cafe.name}
                    </h3>
                    <div className="flex items-center bg-amber-50 px-2 py-1 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-medium text-amber-700">
                        {hasReviews(cafe) ? formatRating(cafe.average_rating) : "N/A"}
                      </span>
                      {(cafe.review_count ?? 0) > 0 && (
                        <span className="text-amber-500 text-xs ml-1">
                          ({cafe.review_count})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Address and Distance */}
                  <p className="text-gray-600 mb-4 text-sm flex items-center">
                    {(() => {
                      // Try to extract just street address and city
                      if (cafe.address) {
                        // Typical US format: "123 Main St, Berkeley, CA 94704"
                        const parts = cafe.address.split(',');
                        if (parts.length >= 2) {
                          return parts[0].trim() + ', ' + parts[1].trim();
                        } else {
                          return cafe.address;
                        }
                      }
                      return '';
                    })()}
                    {userLocation && typeof cafe.latitude === 'number' && typeof cafe.longitude === 'number' && !isNaN(Number(cafe.latitude)) && !isNaN(Number(cafe.longitude)) && (
                      <span className="ml-2 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100">
                        {(() => {
                          const distMeters = haversineDistance(userLocation.lat, userLocation.lng, Number(cafe.latitude), Number(cafe.longitude));
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
                  </p>
                  
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
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
                    
                    {/* Student-Friendliness Score (formerly Service) */}
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
                    
                    {/* Golden Bear Score removed */}
                  </div>
                  
                  {/* Amenities */}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
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
                  {cafe.popular_times && (
                    <div className="mt-5 px-3">
                      {/* Debug the data - using useEffect in a component would be better, but this works for now */}
                      <script dangerouslySetInnerHTML={{ __html: `console.log('Cafe popular_times data for ${cafe.name}:', ${JSON.stringify(cafe.popular_times)})` }} />
                      <PopularTimesChart 
                        data={cafe.popular_times} 
                      />
                    </div>
                  )}
                </div>

                {/* Reviews Section */}
                <div className="border-t border-gray-100 pt-5 mt-5">
                  <div className="flex justify-between items-center mb-4 px-3">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      Reviews
                    </h4>
                    {(cafe.review_count ?? 0) > 0 && (
                      <button
                        onClick={() => setExpandedCafeId(expandedCafeId === cafe.id ? null : cafe.id)}
                        className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center"
                      >
                        {expandedCafeId === cafe.id ? (
                          <>
                            Hide Reviews
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                          </>
                        ) : (
                          <>
                            Show Reviews
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {expandedCafeId === cafe.id && (
                    <div className="mb-5 bg-gray-50 p-4 rounded-lg" style={{ height: 'auto', minHeight: 'min-content' }}>
                      <CafeReviews cafeId={cafe.id} />
                    </div>
                  )}

                  {selectedCafeId === cafe.id ? (
                    <div className="mt-4" style={{ height: 'auto', minHeight: 'min-content' }}>
                      <ReviewForm
                        cafeId={cafe.id}
                        onSuccess={handleReviewSuccess}
                        onCancel={() => setSelectedCafeId(null)}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedCafeId(cafe.id)}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3 rounded-b-lg hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 font-medium shadow-sm transition-all duration-200 ease-in-out mt-3 flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      Write a Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}