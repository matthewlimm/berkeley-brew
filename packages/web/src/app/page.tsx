'use client';

import { useState, useEffect, useRef } from "react";
import { getCafes } from "../services/api";
import { PopularTimesChart } from "../components/PopularTimesChart";
import { CafeReviews } from "../components/CafeReviews";
import { CafeOpeningHours } from "../components/CafeOpeningHours";
import { CafeDetailModal } from "../components/CafeDetailModal";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import HeroSectionWithRotatingBackground from "@/components/HeroSectionWithRotatingBackground";
import BookmarkButton from "@/components/BookmarkButton";
// Import UI components as needed
import { ReviewForm } from "../components/ReviewForm";
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
const calculateGoldenBearScore = (cafe: any) => {
  const scores = [
    cafe.grindability_score,
    cafe.student_friendliness_score,
    cafe.coffee_quality_score,
    cafe.vibe_score
  ].filter(score => score !== null && score !== undefined);
  
  return scores.length > 0 ? scores.reduce((sum, score) => sum + (score || 0), 0) / scores.length : null;
};

// Business hours types based on the actual API response format
type BusinessHoursPeriod = {
  open: {
    day: number; // 0-6 for Sunday-Saturday
    time: string; // Format: "0800" for 8:00 AM
  };
  close: {
    day: number;
    time: string;
  };
};

type BusinessHours = {
  periods: BusinessHoursPeriod[];
  open_now?: boolean;
  weekday_text: string[];
};

// Extended cafe type to include API response fields
// Type for review change data
interface ReviewChangeData {
  action: 'add' | 'edit' | 'delete' | 'refresh';
  cafeId: string;
  userId?: string;
}

type ExtendedCafe = {
  average_rating?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  review_count?: number | null;
  reviews?: any[];
  place_id?: string | null;
  business_hours?: any; // Use any to handle Json type from API
  price_category?: string | null; // Use string to handle any price category from API
  location?: string | null; // Use string to handle any location from API
  name: string;
  id: string;
  image_url?: string | null | undefined;
  address?: string | null | undefined;
  grindability_score?: number | null;
  student_friendliness_score?: number | null;
  coffee_quality_score?: number | null;
  vibe_score?: number | null;
  golden_bear_score?: number | null;
  realtime?: any;
  popular_times?: any;
  user_has_reviewed?: boolean;
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
  const [isWriteReviewModalOpen, setIsWriteReviewModalOpen] = useState(false);
  const [currentReviewCafeId, setCurrentReviewCafeId] = useState<string>('');
  const [userReviewedCafes, setUserReviewedCafes] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  
  // Filter state
  const [isOpenNowActive, setIsOpenNowActive] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<'$' | '$$' | '$$$' | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<'campus' | 'northside' | 'southside' | 'downtown' | 'outer' | null>(null);
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  
  // Business hours dropdown state - only one can be open at a time
  const [openBusinessHoursDropdown, setOpenBusinessHoursDropdown] = useState<string | null>(null);
  
  // Animation state for smooth sorting/filtering
  const [isFiltering, setIsFiltering] = useState(false);
  const [previousCafeIds, setPreviousCafeIds] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasBusinessHoursBeenOpened, setHasBusinessHoursBeenOpened] = useState(false);
  
  // Refs for click outside handling
  const priceDropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  
  // Function to handle review changes (edit/delete/add) and update cafe metrics
    const handleReviewChange = async (reviewData: ReviewChangeData) => {
    console.log('Review changed:', reviewData);
    
    // If a review was added, add the cafe to userReviewedCafes
    if (reviewData?.action === 'add' && reviewData?.cafeId && reviewData?.userId === user?.id) {
      setUserReviewedCafes(prev => {
        const newSet = new Set([...Array.from(prev), reviewData.cafeId]);
        console.log('Added cafe to reviewed cafes:', reviewData.cafeId);
        return newSet;
      });
    }
    
    // If a review was deleted, remove the cafe from userReviewedCafes
    if (reviewData?.action === 'delete' && reviewData?.cafeId) {
      setUserReviewedCafes(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewData.cafeId);
        console.log('Removed cafe from reviewed cafes:', reviewData.cafeId);
        return newSet;
      });
    }
    
    // Refresh cafe data to update metrics
    try {
      setIsLoading(true);
      const response = await getCafes();
      if (response?.data?.cafes) {
        // Update cafes with fresh data
        setCafes(response.data.cafes);
        
        // Update trending cafes
        const trendingCafes = response.data.cafes
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
          .slice(0, 3);
        setTrendingCafes(trendingCafes);
      }
    } catch (error) {
      console.error('Failed to refresh cafe data after review change:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Click outside handler for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close price dropdown when clicking outside
      if (priceDropdownRef.current && !priceDropdownRef.current.contains(event.target as Node)) {
        setIsPriceDropdownOpen(false);
      }
      
      // Close location dropdown when clicking outside
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
      
      // Close business hours dropdown when clicking outside
      if (openBusinessHoursDropdown) {
        const target = event.target as Node;
        // Check if click is outside any business hours dropdown
        const businessHoursDropdowns = document.querySelectorAll('[data-business-hours-dropdown]');
        const businessHoursButtons = document.querySelectorAll('[data-business-hours-button]');
        
        let isOutside = true;
        
        // Check if click is inside any dropdown
        businessHoursDropdowns.forEach(dropdown => {
          if (dropdown.contains(target)) {
            isOutside = false;
          }
        });
        
        // Check if click is on any button
        businessHoursButtons.forEach(button => {
          if (button.contains(target)) {
            isOutside = false;
          }
        });
        
        if (isOutside) {
          setOpenBusinessHoursDropdown(null);
        }
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openBusinessHoursDropdown]);

  // Load cafes on mount
  useEffect(() => {
    setIsLoading(true);
    getCafes()
      .then((response) => {
        if (response?.data?.cafes) {
          const allCafes = response.data.cafes;
          setCafes(allCafes);
          
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
      .finally(() => {
        setIsLoading(false);
        // Set initial load to false after all animations complete
        // Wait a bit longer to ensure animations finish
        setTimeout(() => setIsInitialLoad(false), 5000); // 5 seconds should be enough for any number of cafes
      });
  }, []);

  // Fetch user's reviewed cafes when user changes
  useEffect(() => {
    const fetchUserReviews = async () => {
      if (!user) {
        setUserReviewedCafes(new Set());
        return;
      }

      try {
        const { getUserReviews } = await import('../services/api');
        const response = await getUserReviews();
        
        if (response?.data?.reviews && Array.isArray(response.data.reviews)) {
          const reviewedCafeIds = new Set(
            response.data.reviews.map((review: any) => review.cafe_id).filter(Boolean)
          );
          console.log('User has reviewed cafes:', Array.from(reviewedCafeIds));
          setUserReviewedCafes(reviewedCafeIds);
        }
      } catch (error) {
        console.error('Error fetching user reviews:', error);
        setUserReviewedCafes(new Set());
      }
    };

    fetchUserReviews();
  }, [user]);

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

  // Apply filters
  let filteredCafes = [...cafes];
  
  // Apply Open Now filter
  if (isOpenNowActive) {
    console.log('Applying Open Now filter...');
    console.log('Before filtering:', filteredCafes.length, 'cafes');

    // Helper: compute open status from structured hours (fallback to open_now)
    const computeIsOpenNow = (businessHours: any): boolean => {
      if (!businessHours) return false;
      const now = new Date();
      const currentDay = now.getDay();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const periods = businessHours.periods || businessHours.opening_hours?.periods;
      const openNowFlag = businessHours.open_now ?? businessHours.opening_hours?.open_now;

      if (!Array.isArray(periods) || periods.length === 0) {
        return openNowFlag === true;
      }

      const today = periods.find((p: any) => p?.open?.day === currentDay);
      if (!today || !today.open || !today.close || !today.open.time || !today.close.time) {
        return openNowFlag === true;
      }

      const parse = (t: string) => {
        const hh = parseInt(t.slice(0,2), 10);
        const mm = parseInt(t.slice(2), 10);
        return hh * 60 + mm;
      };

      const openMins = parse(String(today.open.time));
      const closeMins = parse(String(today.close.time));
      const buffer = 15; // minutes

      if (Number.isNaN(openMins) || Number.isNaN(closeMins)) {
        return openNowFlag === true;
      }

      // Overnight handling: close < open means past midnight close
      if (closeMins < openMins) {
        // open from openMins to 24h, or 0 to closeMins-buffer
        return (currentMinutes >= openMins) || (currentMinutes < (closeMins - buffer));
      }

      // Same-day window
      return (currentMinutes >= openMins) && (currentMinutes < (closeMins - buffer));
    };
    
    const openCafes = filteredCafes.filter(cafe => {
      const isOpen = computeIsOpenNow(cafe.business_hours);
      console.log(`${cafe.name}: ${isOpen ? 'OPEN' : 'CLOSED'}`);
      return isOpen;
    });
    
    filteredCafes = openCafes;
    console.log('After Open Now filtering:', filteredCafes.length, 'cafes remaining');
    
    if (filteredCafes.length === 0) {
      console.log('WARNING: No cafes are currently open!');
      cafes.slice(0, 3).forEach(cafe => {
        console.log(`Sample business hours for ${cafe.name}:`, cafe.business_hours);
      });
    }
  }
  
  // Apply Price filter
  if (selectedPrice) {
    filteredCafes = filteredCafes.filter(cafe => cafe.price_category === selectedPrice);
    console.log('Filtered by Price:', selectedPrice, filteredCafes.length, 'cafes remaining');
  }
  
  // Apply Location filter
  if (selectedLocation) {
    filteredCafes = filteredCafes.filter(cafe => cafe.location === selectedLocation);
    console.log('Filtered by Location:', selectedLocation, filteredCafes.length, 'cafes remaining');
  }
  
  // Sorting logic
  let sortedCafes = [...filteredCafes];
  
  // Haversine distance calculation function
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
  
  // Sort by selected criteria
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

  useEffect(() => {
    if (isWriteReviewModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isWriteReviewModalOpen]);

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

      {/* All Cafes Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="mb-6 w-full">
            <div className="bg-white border border-amber-200 rounded-lg px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
              <div className="flex flex-col">
                <label htmlFor="sort-dropdown" className="text-sm font-semibold text-amber-700 mb-1">Sort & Explore Cafes</label>
                <span className="text-xs text-gray-500">Choose how to order the list below.</span>
              </div>
              <div className="relative w-full sm:w-auto">
                <select
                  id="sort-dropdown"
                  className="w-full border border-amber-400 rounded-lg px-4 py-2 text-sm bg-gradient-to-r from-amber-50 to-yellow-100 focus:ring-amber-400 focus:border-amber-500 shadow-sm transition-all duration-150 ease-in-out hover:border-amber-600 hover:bg-amber-100 appearance-none pr-10"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  style={{ minWidth: 180 }}
                >
                  <option value="distance">Closest</option>
                  <option value="rating">Highest Rated</option>
                  <option value="mostReviewed">Most Reviewed</option>
                  <option value="grindability">Grindability</option>
                  <option value="vibe">Vibe</option>
                  <option value="studentFriendliness">Friendly</option>
                  <option value="coffeeQuality">Coffee</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
              {sortBy === 'distance' && !userLocation && (
                <span className="text-xs text-red-500 sm:ml-2">Allow location access to sort by distance</span>
              )}
            </div>
            
            {/* Filter buttons */}
            <div className="flex items-center gap-2 mt-3 flex-nowrap w-full justify-start sm:gap-2 sm:flex-wrap">
              {/* Open Now button */}
              <button 
                onClick={() => setIsOpenNowActive(!isOpenNowActive)}
                className={`w-auto px-2 py-1.5 rounded-full text-xs sm:w-[130px] sm:px-3 sm:py-2 sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-1.5 filter-button transition-all duration-300 whitespace-nowrap ${
                  isOpenNowActive 
                    ? 'bg-amber-500 text-white shadow-lg animate-pulse-glow' 
                    : 'bg-white border border-amber-300 text-gray-700 hover:bg-amber-50 hover:shadow-md'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Open Now</span>
              </button>
              
              {/* Price dropdown */}
              <div className="relative" ref={priceDropdownRef}>
                <button 
                  onClick={() => {
                    setIsPriceDropdownOpen(!isPriceDropdownOpen);
                    setIsLocationDropdownOpen(false);
                  }}
                  className={`w-auto px-2 py-1.5 rounded-full text-xs sm:w-[120px] sm:px-4 sm:py-2 sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-1.5 filter-button transition-all duration-300 ${
                    selectedPrice 
                      ? 'bg-amber-500 text-white shadow-lg animate-pulse-glow' 
                      : 'bg-white border border-amber-300 text-gray-700 hover:bg-amber-50 hover:shadow-md'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{selectedPrice || 'Price'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 ${isPriceDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isPriceDropdownOpen && (
                  <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-48 bg-white rounded-lg shadow-lg overflow-visible z-50 border border-gray-200 py-1 animate-fade-in-down max-w-[calc(100vw-1rem)]">
                    <button 
                      onClick={() => {
                        setSelectedPrice('$');
                        setIsPriceDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-amber-50 ${selectedPrice === '$' ? 'bg-amber-100 text-amber-800 font-medium' : 'text-gray-700'}`}
                    >
                      $ (Budget-friendly)
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedPrice('$$');
                        setIsPriceDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-amber-50 ${selectedPrice === '$$' ? 'bg-amber-100 text-amber-800 font-medium' : 'text-gray-700'}`}
                    >
                      $$ (Mid-range)
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedPrice('$$$');
                        setIsPriceDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-amber-50 ${selectedPrice === '$$$' ? 'bg-amber-100 text-amber-800 font-medium' : 'text-gray-700'}`}
                    >
                      $$$ (High-end)
                    </button>
                    {selectedPrice && (
                      <div className="border-t border-gray-200 mt-1">
                        <button 
                          onClick={() => {
                            setSelectedPrice(null);
                            setIsPriceDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 font-medium"
                        >
                          Clear Filter
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Location dropdown */}
              <div className="relative" ref={locationDropdownRef}>
                <button 
                  onClick={() => {
                    setIsLocationDropdownOpen(!isLocationDropdownOpen);
                    setIsPriceDropdownOpen(false);
                  }}
                  className={`w-auto px-2 py-1.5 rounded-full text-xs sm:w-[140px] sm:px-4 sm:py-2 sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-1.5 filter-button transition-all duration-300 ${
                    selectedLocation 
                      ? 'bg-amber-500 text-white shadow-lg animate-pulse-glow' 
                      : 'bg-white border border-amber-300 text-gray-700 hover:bg-amber-50 hover:shadow-md'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="sm:hidden">
                    {selectedLocation === 'northside' ? 'North' :
                     selectedLocation === 'southside' ? 'South' :
                     selectedLocation === 'downtown' ? 'Downtown' :
                     selectedLocation === 'campus' ? 'Campus' :
                     selectedLocation === 'outer' ? 'Outer' : 'Location'}
                  </span>
                  <span className="hidden sm:inline">{selectedLocation ? selectedLocation.charAt(0).toUpperCase() + selectedLocation.slice(1) : 'Location'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 ${isLocationDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isLocationDropdownOpen && (
                  <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-48 bg-white rounded-lg shadow-lg overflow-visible z-50 border border-gray-200 py-1 animate-fade-in-down max-w-[calc(100vw-1rem)]">
                    <button 
                      onClick={() => {
                        setSelectedLocation('campus');
                        setIsLocationDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-amber-50 ${selectedLocation === 'campus' ? 'bg-amber-100 text-amber-800 font-medium' : 'text-gray-700'}`}
                    >
                      Campus
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedLocation('northside');
                        setIsLocationDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-amber-50 ${selectedLocation === 'northside' ? 'bg-amber-100 text-amber-800 font-medium' : 'text-gray-700'}`}
                    >
                      Northside
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedLocation('southside');
                        setIsLocationDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-amber-50 ${selectedLocation === 'southside' ? 'bg-amber-100 text-amber-800 font-medium' : 'text-gray-700'}`}
                    >
                      Southside
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedLocation('downtown');
                        setIsLocationDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-amber-50 ${selectedLocation === 'downtown' ? 'bg-amber-100 text-amber-800 font-medium' : 'text-gray-700'}`}
                    >
                      Downtown
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedLocation('outer');
                        setIsLocationDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-amber-50 ${selectedLocation === 'outer' ? 'bg-amber-100 text-amber-800 font-medium' : 'text-gray-700'}`}
                    >
                      Outer Berkeley
                    </button>
                    {selectedLocation && (
                      <div className="border-t border-gray-200 mt-1">
                        <button 
                          onClick={() => {
                            setSelectedLocation(null);
                            setIsLocationDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 font-medium"
                        >
                          Clear Filter
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Clear All Filters button */}
              {(isOpenNowActive || selectedPrice || selectedLocation) && (
                <button 
                  onClick={() => {
                    setIsOpenNowActive(false);
                    setSelectedPrice(null);
                    setSelectedLocation(null);
                  }}
                  className="inline-flex items-center justify-center rounded-full text-red-700 border border-red-300 bg-white hover:bg-red-50 hover:border-red-400 shadow-sm transition-all whitespace-nowrap h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-2 text-xs sm:text-sm gap-0 sm:gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Clear filters">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-14 w-14 border-t-3 border-b-3 border-amber-500"></div>
          </div>
        ) : sortedCafes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-amber-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No cafes match your filters</h3>
            <p className="text-gray-500 mb-6 max-w-md">Try adjusting your filters or clearing them to see more results.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCafes.map((cafe, index) => (
              <div
                key={cafe.id}
                className={`bg-white rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 ${
                  isInitialLoad && !hasBusinessHoursBeenOpened && openBusinessHoursDropdown !== cafe.id ? 'animate-fade-in-up opacity-0' : 'opacity-100'
                }`}
                style={{
                  ...(isInitialLoad && !hasBusinessHoursBeenOpened && openBusinessHoursDropdown !== cafe.id ? { animationFillMode: 'forwards' } : {}),
                  zIndex: openBusinessHoursDropdown === cafe.id ? 999999 : 'auto',
                  position: openBusinessHoursDropdown === cafe.id ? 'relative' : 'static'
                }}
              >
                {/* Desktop Layout */}
                <div className="hidden sm:flex h-32">
                  {/* Cafe Image - Left side, compact */}
                  <div 
                    className="relative w-48 h-32 flex-shrink-0 cursor-pointer hover:opacity-95 transition-opacity" 
                    onClick={() => setSelectedCafeId(cafe.id)}
                  >
                    <div
                      className="h-full w-full bg-cover bg-center rounded-l-lg"
                      style={{ 
                        backgroundImage: `url(${cafe.image_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'})`
                      }}
                    />
                  </div>

                  {/* Middle content area */}
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate"
                          title={cafe.name}
                        >
                          <span 
                            className="cursor-pointer hover:text-amber-600 transition-colors"
                            onClick={() => setSelectedCafeId(cafe.id)}
                          >
                            {cafe.name}
                          </span>
                        </h3>
                        <BookmarkButton key={`bookmark-${cafe.id}`} cafeId={cafe.id} size="sm" />
                      </div>
                      
                      {/* Address and Distance */}
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-gray-600 text-sm truncate">
                          {(() => {
                            if (cafe.address) {
                              const parts = cafe.address.split(',');
                              if (parts.length >= 2) {
                                return parts[0].trim() + ', ' + parts[1].trim();
                              } else {
                                return cafe.address;
                              }
                            }
                            return '';
                          })()}
                        </p>
                        {userLocation && typeof cafe.latitude === 'number' && typeof cafe.longitude === 'number' && !isNaN(Number(cafe.latitude)) && !isNaN(Number(cafe.longitude)) && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100 flex-shrink-0">
                            {(() => {
                              const distMeters = haversineDistance(userLocation.lat, userLocation.lng, Number(cafe.latitude), Number(cafe.longitude));
                              const metersPerMile = 1609.34;
                              const metersPerFoot = 0.3048;
                              const distMiles = distMeters / metersPerMile;
                              if (distMiles < 0.1) {
                                const distFeet = distMeters / metersPerFoot;
                                return `${Math.round(distFeet)} ft`;
                              } else {
                                return `${distMiles.toFixed(2)} mi`;
                              }
                            })()}
                          </span>
                        )}
                      </div>

                      {/* Opening Hours */}
                      <div className="text-sm text-gray-600 mb-2">
                        <CafeOpeningHours 
                          name={cafe.name} 
                          placeId={cafe.place_id} 
                          businessHours={cafe.business_hours}
                          cafeId={cafe.id}
                          isOpen={openBusinessHoursDropdown === cafe.id}
                          onToggle={(cafeId) => {
                            if (openBusinessHoursDropdown !== cafeId) {
                              setHasBusinessHoursBeenOpened(true);
                            }
                            setOpenBusinessHoursDropdown(openBusinessHoursDropdown === cafeId ? null : cafeId);
                          }}
                        />
                      </div>
                    </div>

                    {/* Bottom row with metrics, reviews, and popular times */}
                    <div className="flex items-center justify-between gap-4">
                      {/* Compact Metrics */}
                      <div className="flex gap-1.5">
                        <div className="flex items-center bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          <span className="text-xs text-blue-700 font-medium mr-1">Grind</span>
                          <span className="text-xs font-bold text-blue-700">
                            {hasReviews(cafe) ? formatRating(getScoreValue(cafe, 'grindability_score')) : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100">
                          <span className="text-xs text-pink-700 font-medium mr-1">Vibe</span>
                          <span className="text-xs font-bold text-pink-700">
                            {hasReviews(cafe) ? formatRating(getScoreValue(cafe, 'vibe_score')) : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                          <span className="text-xs text-amber-700 font-medium mr-1">Coffee</span>
                          <span className="text-xs font-bold text-amber-700">
                            {hasReviews(cafe) ? formatRating(getScoreValue(cafe, 'coffee_quality_score')) : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                          <span className="text-xs text-green-700 font-medium mr-1">Friendly</span>
                          <span className="text-xs font-bold text-green-700">
                            {hasReviews(cafe) ? formatRating(getScoreValue(cafe, 'student_friendliness_score')) : "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Empty space - reviews and popular times moved to right column */}
                      <div></div>
                    </div>
                  </div>

                  {/* Right actions column */}
                  <div className="w-36 p-3 flex flex-col justify-between">
                    {/* Top section - Price and Rating */}
                    <div className="flex items-center gap-2 justify-end">
                      {cafe.price_category && (
                        <span className="bg-green-100 text-green-800 font-medium text-sm px-2 py-1 rounded border border-green-200">
                          {cafe.price_category}
                        </span>
                      )}
                      <div className="flex items-center bg-amber-50 px-2 py-1 rounded shadow-sm border border-amber-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-medium text-amber-700">
                          {hasReviews(cafe) ? formatRating(cafe.average_rating) : "N/A"}
                        </span>
                        {(cafe.review_count ?? 0) > 0 && (
                          <span className="text-amber-500 text-sm ml-1">
                            ({cafe.review_count})
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Middle section - Write Review */}
                    <div className="flex flex-col gap-2 items-end">
                      {/* Write Review Button */}
                      {(() => {
                        const hasUserReviewed = user && userReviewedCafes.has(cafe.id);
                        
                        return hasUserReviewed ? (
                          <div className="text-sm text-green-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Reviewed
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setIsWriteReviewModalOpen(true);
                              setCurrentReviewCafeId(cafe.id);
                            }}
                            className="text-sm text-white font-medium bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded transition-colors shadow-sm"
                          >
                            Write Review
                          </button>
                        );
                      })()}
                    </div>
                    
                    {/* Bottom section - Popular Times */}
                    <div className="flex justify-end">
                      {cafe.popular_times && (
                        <button
                          onClick={() => setExpandedCafeId(expandedCafeId === cafe.id ? null : cafe.id)}
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center"
                        >
                          Popular Times
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ml-1 transition-transform ${expandedCafeId === cafe.id ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="sm:hidden p-3">
                  {/* Mobile Header */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Cafe Image - Mobile */}
                    <div 
                      className="relative w-20 h-20 flex-shrink-0 cursor-pointer hover:opacity-95 transition-opacity rounded-lg overflow-hidden" 
                      onClick={() => setSelectedCafeId(cafe.id)}
                    >
                      <div
                        className="h-full w-full bg-cover bg-center"
                        style={{ 
                          backgroundImage: `url(${cafe.image_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'})`
                        }}
                      />
                    </div>

                    {/* Mobile Title and Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate"
                          title={cafe.name}
                        >
                          <span 
                            className="cursor-pointer hover:text-amber-600 transition-colors"
                            onClick={() => setSelectedCafeId(cafe.id)}
                          >
                            {cafe.name}
                          </span>
                        </h3>
                        <BookmarkButton key={`bookmark-${cafe.id}`} cafeId={cafe.id} size="sm" />
                      </div>
                      
                      {/* Address */}
                      <p className="text-gray-600 text-sm truncate mb-1">
                        {(() => {
                          if (cafe.address) {
                            const parts = cafe.address.split(',');
                            if (parts.length >= 2) {
                              return parts[0].trim() + ', ' + parts[1].trim();
                            } else {
                              return cafe.address;
                            }
                          }
                          return '';
                        })()}
                      </p>

                      {/* Rating and Distance */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center bg-amber-50 px-2 py-1 rounded shadow-sm border border-amber-100">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-amber-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-medium text-amber-700">
                            {hasReviews(cafe) ? formatRating(cafe.average_rating) : "N/A"}
                          </span>
                          {(cafe.review_count ?? 0) > 0 && (
                            <span className="text-amber-500 text-xs ml-1">
                              ({cafe.review_count})
                            </span>
                          )}
                        </div>
                        
                        {cafe.price_category && (
                          <span className="bg-green-100 text-green-800 font-medium text-xs px-2 py-1 rounded border border-green-200">
                            {cafe.price_category}
                          </span>
                        )}
                        
                        {userLocation && typeof cafe.latitude === 'number' && typeof cafe.longitude === 'number' && !isNaN(Number(cafe.latitude)) && !isNaN(Number(cafe.longitude)) && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100 flex-shrink-0">
                            {(() => {
                              const distMeters = haversineDistance(userLocation.lat, userLocation.lng, Number(cafe.latitude), Number(cafe.longitude));
                              const metersPerMile = 1609.34;
                              const metersPerFoot = 0.3048;
                              const distMiles = distMeters / metersPerMile;
                              if (distMiles < 0.1) {
                                const distFeet = distMeters / metersPerFoot;
                                return `${Math.round(distFeet)} ft`;
                              } else {
                                return `${distMiles.toFixed(2)} mi`;
                              }
                            })()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Opening Hours */}
                  <div className="text-sm text-gray-600 mb-3">
                    <CafeOpeningHours 
                      name={cafe.name} 
                      placeId={cafe.place_id} 
                      businessHours={cafe.business_hours}
                      cafeId={cafe.id}
                      isOpen={openBusinessHoursDropdown === cafe.id}
                      onToggle={(cafeId) => {
                        if (openBusinessHoursDropdown !== cafeId) {
                          setHasBusinessHoursBeenOpened(true);
                        }
                        setOpenBusinessHoursDropdown(openBusinessHoursDropdown === cafeId ? null : cafeId);
                      }}
                    />
                  </div>

                  {/* Mobile Metrics */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <div className="flex items-center bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                      <span className="text-xs text-blue-700 font-medium mr-1">Grind</span>
                      <span className="text-xs font-bold text-blue-700">
                        {hasReviews(cafe) ? formatRating(getScoreValue(cafe, 'grindability_score')) : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100">
                      <span className="text-xs text-pink-700 font-medium mr-1">Vibe</span>
                      <span className="text-xs font-bold text-pink-700">
                        {hasReviews(cafe) ? formatRating(getScoreValue(cafe, 'vibe_score')) : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                      <span className="text-xs text-amber-700 font-medium mr-1">Coffee</span>
                      <span className="text-xs font-bold text-amber-700">
                        {hasReviews(cafe) ? formatRating(getScoreValue(cafe, 'coffee_quality_score')) : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                      <span className="text-xs text-green-700 font-medium mr-1">Friend</span>
                      <span className="text-xs font-bold text-green-700">
                        {hasReviews(cafe) ? formatRating(getScoreValue(cafe, 'student_friendliness_score')) : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex items-center justify-between">
                    {/* Write Review Button */}
                    <div className="flex items-center gap-2">
                      {(() => {
                        const hasUserReviewed = user && userReviewedCafes.has(cafe.id);
                        
                        return hasUserReviewed ? (
                          <div className="text-sm text-green-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Reviewed
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setIsWriteReviewModalOpen(true);
                              setCurrentReviewCafeId(cafe.id);
                            }}
                            className="text-sm text-white font-medium bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded transition-colors shadow-sm"
                          >
                            Write Review
                          </button>
                        );
                      })()}
                    </div>
                    
                    {/* Popular Times */}
                    <div className="flex items-center gap-2">
                      {cafe.popular_times && (
                        <button
                          onClick={() => setExpandedCafeId(expandedCafeId === cafe.id ? null : cafe.id)}
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center"
                        >
                          Popular Times
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ml-1 transition-transform ${expandedCafeId === cafe.id ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Popular Times Chart */}
                {expandedCafeId === cafe.id && cafe.popular_times && (
                  <div className="bg-gray-50 pt-2 px-2 pb-1 border-t border-gray-200">
                    <div className="max-w-4xl mx-auto">
                      {/* Live Data Indicator */}
                      {(cafe.realtime || (cafe.popular_times && (cafe.popular_times.live_busyness !== undefined || cafe.popular_times.current_popularity !== undefined))) && (
                        <div className="flex items-center gap-2 mb-3 text-xs">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-green-700 font-medium">Live data available</span>
                        </div>
                      )}
                      <PopularTimesChart 
                        data={cafe.popular_times} 
                        hasLiveData={!!(cafe.realtime || (cafe.popular_times && (cafe.popular_times.live_busyness !== undefined || cafe.popular_times.current_popularity !== undefined)))}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Cafe Detail Modal */}
        {selectedCafeId && cafes.find(cafe => cafe.id === selectedCafeId) && (
          <CafeDetailModal 
            cafe={{
              ...cafes.find(cafe => cafe.id === selectedCafeId)!,
              image_url: cafes.find(cafe => cafe.id === selectedCafeId)?.image_url || undefined,
              address: cafes.find(cafe => cafe.id === selectedCafeId)?.address || undefined,
              user_has_reviewed: !!(user && userReviewedCafes.has(selectedCafeId))
            }}
            isOpen={!!selectedCafeId}
            onClose={() => setSelectedCafeId(null)}
            formatRating={formatRating}
            hasReviews={hasReviews}
            getScoreValue={getScoreValue}
            onReviewChange={handleReviewChange}
            onReviewSubmit={() => {
              setIsLoading(true);
              getCafes()
                .then((response) => {
                  if (response?.data?.cafes) {
                    setCafes(response.data.cafes);
                  }
                })
                .catch((e) => console.error("Failed to refresh cafes:", e))
                .finally(() => setIsLoading(false));
            }}
          />
        )}
        
        {/* Write Review Modal */}
        {isWriteReviewModalOpen && currentReviewCafeId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto p-4 pt-10 sm:pt-12" onClick={() => {
            setIsWriteReviewModalOpen(false);
            setCurrentReviewCafeId('');
          }}>
            <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <ReviewForm 
                cafeId={currentReviewCafeId} 
                onClose={() => {
                  setIsWriteReviewModalOpen(false);
                  setCurrentReviewCafeId('');
                }}
                onSuccess={(reviewData) => {
                  setIsWriteReviewModalOpen(false);
                  setUserReviewedCafes(prev => new Set([...Array.from(prev), currentReviewCafeId]));
                  setCurrentReviewCafeId('');
                  
                  setIsLoading(true);
                  getCafes()
                    .then((response) => {
                      if (response?.data?.cafes) {
                        setCafes(response.data.cafes);
                      }
                    })
                    .catch((e) => console.error("Failed to refresh cafes:", e))
                    .finally(() => setIsLoading(false));
                }}
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
