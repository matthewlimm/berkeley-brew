'use client';

import React, { useState, useEffect } from 'react';

interface OpeningHoursProps {
  placeId: string;
  name: string;
}

interface OpeningStatus {
  isOpen: boolean;
  status: 'open' | 'closed' | 'opening-soon' | 'closing-soon';
  statusText: string;
  hoursToday?: string;
}

export const OpeningHours: React.FC<OpeningHoursProps> = ({ placeId, name }) => {
  const [status, setStatus] = useState<OpeningStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpeningHours = async () => {
      if (!placeId) {
        setLoading(false);
        setError('No place ID available');
        return;
      }

      try {
        const response = await fetch(`/api/places/hours?placeId=${encodeURIComponent(placeId)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch opening hours');
        }
        
        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
          setStatus(data.data);
        } else {
          throw new Error(data.message || 'Failed to get opening hours');
        }
      } catch (err) {
        console.error('Error fetching opening hours:', err);
        setError('Could not load opening hours');
      } finally {
        setLoading(false);
      }
    };

    fetchOpeningHours();
  }, [placeId]);

  if (loading) {
    return (
      <div className="flex items-center text-xs text-gray-500">
        <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Checking hours...
      </div>
    );
  }

  if (error || !status) {
    // Fallback to just showing the name without hours
    return null;
  }

  const getStatusDisplay = () => {
    switch (status.status) {
      case 'open':
        return (
          <span className="text-green-600 font-medium">Open</span>
        );
      case 'closed':
        return (
          <span className="text-red-600 font-medium">Closed</span>
        );
      case 'opening-soon':
        return (
          <span className="text-amber-600 font-medium">Opening Soon</span>
        );
      case 'closing-soon':
        return (
          <span className="text-amber-600 font-medium">Closing Soon</span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center text-xs text-gray-600 mb-1">
      {getStatusDisplay()}
      {status.hoursToday && (
        <span className="ml-1">· {status.hoursToday}</span>
      )}
    </div>
  );
};

export default OpeningHours;
