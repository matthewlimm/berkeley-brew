'use client';

import { useState, useEffect } from "react";
import { getCafes } from "../services/api";
import { ReviewForm } from "../components/ReviewForm";
import { CafeReviews } from "../components/CafeReviews";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { PostCreator } from "../components/PostCreator";
import MainLayout from "@/components/layout/MainLayout";
import HeroSectionWithRotatingBackground from "@/components/HeroSectionWithRotatingBackground";

// Helper function to format rating display
function formatRating(rating: number | null): string {
  if (rating === null) return "No ratings";
  return rating.toFixed(1);
}

export default function Home() {
  const [cafes, setCafes] = useState<any[]>([]);
  const [trendingCafes, setTrendingCafes] = useState<any[]>([]);
  const [error, setError] = useState<string>();
  const [selectedCafeId, setSelectedCafeId] = useState<string | null>(null);
  const [expandedCafeId, setExpandedCafeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Load cafes on mount
  useEffect(() => {
    setIsLoading(true);
    getCafes()
      .then((response) => {
        if (response?.data?.cafes) {
          const allCafes = response.data.cafes;
          setCafes(allCafes);
          
          // Get trending cafes (highest rated)
          const trending = [...allCafes]
            .filter(cafe => cafe.average_rating !== null)
            .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
            .slice(0, 4);
          setTrendingCafes(trending);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load cafes"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleReviewSuccess = async () => {
    // Refresh cafes to show updated ratings
    try {
      setIsLoading(true);
      const response = await getCafes();
      if (response?.data?.cafes) {
        const allCafes = response.data.cafes;
        setCafes(allCafes);
        
        // Update trending cafes
        const trending = [...allCafes]
          .filter(cafe => cafe.average_rating !== null)
          .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
          .slice(0, 4);
        setTrendingCafes(trending);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh cafes");
    } finally {
      setIsLoading(false);
      setSelectedCafeId(null);
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


      {/* Trending Cafes Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Trending Cafes</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingCafes.map((cafe) => (
              <Link href={`/cafes/${cafe.id}`} key={cafe.id} className="block">
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  <div className="h-40 bg-amber-100 flex items-center justify-center">
                    {/* Replace with actual image when available */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">{cafe.name}</h3>
                      <div className="bg-amber-50 px-2 py-0.5 rounded-full flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span className="text-sm font-medium text-amber-700">
                          {formatRating(cafe.average_rating)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 truncate">{cafe.address}</p>
                    <p className="mt-2 text-xs text-gray-400">{cafe.review_count || 0} reviews</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* All Cafes Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">All Cafes</h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Rating
            </button>
            <button className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Distance
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cafes.map((cafe) => (
              <div
                key={cafe.id}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex-grow">
                    {cafe.name}
                  </h3>
                  <div className="bg-gray-50 px-2 py-0.5 rounded-full text-sm">
                    <span className="text-gray-700">
                      {formatRating(cafe.average_rating)}
                    </span>
                    {cafe.review_count > 0 && (
                      <span className="text-gray-500 text-sm ml-1">
                        ({cafe.review_count})
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{cafe.address}</p>

                <div className="flex gap-4 text-sm text-gray-600 mb-4">
                  {cafe.realtime?.[0]?.wifi_availability && (
                    <div>
                      Wifi:{" "}
                      <span className="capitalize">
                        {cafe.realtime[0].wifi_availability}
                      </span>
                    </div>
                  )}
                  {cafe.realtime?.[0]?.outlet_availability && (
                    <div>
                      Outlets:{" "}
                      <span className="capitalize">
                        {cafe.realtime[0].outlet_availability}
                      </span>
                    </div>
                  )}
                  {cafe.realtime?.[0]?.seating && (
                    <div>
                      Seating:{" "}
                      <span className="capitalize">
                        {cafe.realtime[0].seating}
                      </span>
                    </div>
                  )}
                </div>

                {/* Reviews Section */}
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium text-gray-900">Reviews</h4>
                    {cafe.review_count > 0 && (
                      <button
                        onClick={() => setExpandedCafeId(expandedCafeId === cafe.id ? null : cafe.id)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {expandedCafeId === cafe.id ? 'Hide Reviews' : 'Show Reviews'}
                      </button>
                    )}
                  </div>

                  {expandedCafeId === cafe.id && (
                    <div className="mb-4">
                      <CafeReviews cafeId={cafe.id} />
                    </div>
                  )}

                  {selectedCafeId === cafe.id ? (
                    <ReviewForm
                      cafeId={cafe.id}
                      onSuccess={handleReviewSuccess}
                      onCancel={() => setSelectedCafeId(null)}
                    />
                  ) : (
                    <button
                      onClick={() => setSelectedCafeId(cafe.id)}
                      className="w-full bg-gray-50 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
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