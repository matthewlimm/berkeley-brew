'use client';
import React from "react";

import { useEffect, useState } from "react";
import { getCafes } from "@/services/api";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  // Returns distance in meters between two lat/lng points
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


export default function CafesPage() {
  const [cafes, setCafes] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'subscore' | 'mostReviewed'>('rating');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCafes()
      .then((res) => {
        if (res.data?.cafes) setCafes(res.data.cafes);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Failed to load cafes');
        setLoading(false);
      });
  }, []);

  // Ask for location if sorting by distance
  useEffect(() => {
    if (sortBy === 'distance' && !userLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => setError('Location access denied or unavailable.')
        );
      } else {
        setError('Geolocation not supported by your browser.');
      }
    }
  }, [sortBy, userLocation]);

  let sortedCafes = [...cafes];
  if (sortBy === 'distance' && userLocation) {
    sortedCafes.sort((a, b) => {
      if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) return 0;
      const distA = haversineDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
      const distB = haversineDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
      return distA - distB;
    });
  } else if (sortBy === 'mostReviewed') {
    sortedCafes.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
  } else if (sortBy === 'subscore') {
    sortedCafes.sort((a, b) => {
      const subA = (a.grindability_score || 0) + (a.student_friendliness_score || 0) + (a.coffee_quality_score || 0) + (a.vibe_score || 0);
      const subB = (b.grindability_score || 0) + (b.student_friendliness_score || 0) + (b.coffee_quality_score || 0) + (b.vibe_score || 0);
      return subB - subA;
    });
  } else {
    // Default: golden bear score or average_rating
    sortedCafes.sort((a, b) => (b.golden_bear_score || b.average_rating || 0) - (a.golden_bear_score || a.average_rating || 0));
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Berkeley Cafes</h1>
      <div className="mb-6">
        <div className="bg-white border border-amber-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
          <div className="flex flex-col">
            <label htmlFor="sort-dropdown" className="text-sm font-semibold text-amber-700 mb-1">Sort & Explore Cafes</label>
            <span className="text-xs text-gray-500">Choose how to order the list below.</span>
          </div>
          <select
            id="sort-dropdown"
            className="border border-amber-300 rounded px-3 py-2 text-sm bg-amber-50 focus:ring-amber-400 focus:border-amber-400"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="rating">Highest Rated</option>
            <option value="subscore">Best Subscores</option>
            <option value="distance">Closest</option>
            <option value="mostReviewed">Most Reviewed</option>
          </select>
          {sortBy === 'distance' && !userLocation && (
            <span className="text-xs text-red-500 ml-2">Allow location access to sort by distance</span>
          )}
        </div>
      </div>
      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading cafes...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-10">{error}</div>
      ) : (
        <ul className="space-y-6">
          {sortedCafes.map((cafe) => (
            <li key={cafe.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <h2 className="text-xl font-semibold">{cafe.name}</h2>
              <div className="text-gray-600">{cafe.address}</div>
              <div className="mt-2 text-yellow-600 font-bold">
                Rating: {cafe.golden_bear_score ?? cafe.average_rating ?? 'N/A'} / 5
              </div>
              <div className="text-xs text-gray-500 mt-1 flex gap-4">
                <span>Reviews: {cafe.review_count ?? 0}</span>
                {sortBy === 'distance' && userLocation && cafe.latitude && cafe.longitude && (
                  <span>
                    Distance: {Math.round(haversineDistance(userLocation.lat, userLocation.lng, cafe.latitude, cafe.longitude) / 10) / 100} km
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Subscores: G {cafe.grindability_score ?? '-'} / S {cafe.student_friendliness_score ?? '-'} / C {cafe.coffee_quality_score ?? '-'} / V {cafe.vibe_score ?? '-'}
              </div>
              {cafe.description && <p className="mt-2 text-gray-800">{cafe.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

