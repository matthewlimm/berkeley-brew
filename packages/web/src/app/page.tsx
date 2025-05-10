'use client';

import { useState, useEffect } from "react";
import { getCafes } from "../services/api";
import { ReviewForm } from "../components/ReviewForm";
import { CafeReviews } from "../components/CafeReviews";
<<<<<<< HEAD
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
=======
import { PostCreator } from "../components/PostCreator";
>>>>>>> a3918bd2c4e912bcc6db85db12f5cd97c27b62a1

// Helper function to format rating display
function formatRating(rating: number | null): string {
  if (rating === null) return "No ratings";
  return rating.toFixed(1);
}

export default function Home() {
  const [cafes, setCafes] = useState<any[]>([]);
  const [error, setError] = useState<string>();
  const [selectedCafeId, setSelectedCafeId] = useState<string | null>(null);
  const [expandedCafeId, setExpandedCafeId] = useState<string | null>(null);
  const { user, signOut } = useAuth();

  // Load cafes on mount
  useEffect(() => {
    getCafes()
      .then((response) => {
        if (response?.data?.cafes) {
          setCafes(response.data.cafes);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load cafes"));
  }, []);

  const handleReviewSuccess = async () => {
    // Refresh cafes to show updated ratings
    try {
      const response = await getCafes();
      if (response?.data?.cafes) {
        setCafes(response.data.cafes);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh cafes");
    }
    setSelectedCafeId(null);
  };

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Berkeley Brew</h1>
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-600">Error: {error}</p>
          <p className="text-red-500 mt-2">
            Make sure the backend server is running on port 3001
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Berkeley Brew</h1>
          
          {user ? (
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium text-gray-700">{user.email}</span>
                <span className="text-xs text-gray-500 block">ID: {user.id.substring(0, 8)}...</span>
                <button
                  onClick={() => signOut()}
                  className="ml-4 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div>
              <Link href="/auth/login" className="text-amber-600 hover:text-amber-500 mr-4">
                Login
              </Link>
              <Link href="/auth/signup" className="text-amber-600 hover:text-amber-500">
                Sign up
              </Link>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cafes.map((cafe) => (
            <div
              key={cafe.id}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex-grow">
                  {cafe.name}
                </h2>
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
                  <h3 className="text-sm font-medium text-gray-900">Reviews</h3>
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
      </div>
    </main>
  );
}
