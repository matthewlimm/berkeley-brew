'use client';

import React, { useState, useEffect } from 'react';

interface CafeOpeningHoursProps {
  name: string;
  placeId?: string | null;
  businessHours?: any; // JSONB from database containing opening_hours data
}

interface OpeningStatus {
  isOpen: boolean;
  status: 'open' | 'closed' | 'opening-soon' | 'closing-soon' | 'unknown';
  statusText: string;
  hoursToday?: string;
  allHours?: Record<number, string>; // All business hours by day number (0=Sunday, 1=Monday, etc.)
}

export const CafeOpeningHours: React.FC<CafeOpeningHoursProps> = ({ name, placeId, businessHours }) => {
  const [status, setStatus] = useState<OpeningStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllHours, setShowAllHours] = useState<boolean>(false);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const determineOpeningStatus = () => {
      // Debug the business hours data
      console.log(`Business hours for ${name}:`, businessHours);
      console.log(`Place ID for ${name}:`, placeId);
      
      // If we have business hours from the database, use that
      if (businessHours) {
        try {
          const now = new Date();
          const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTimeMinutes = currentHour * 60 + currentMinute;
          
          // Check if we have periods directly or nested in opening_hours
          const periods = businessHours.periods || 
                         (businessHours.opening_hours && businessHours.opening_hours.periods) || 
                         [];
          
          // Check if we have open_now directly or nested in opening_hours
          const openNow = businessHours.open_now !== undefined ? 
                         businessHours.open_now : 
                         (businessHours.opening_hours && businessHours.opening_hours.open_now);
          
          // Find today's hours
          const todayPeriod = periods.find(
            (period: any) => period.open && period.open.day === currentDay
          );
          
          if (!todayPeriod) {
            // No hours for today (might be closed)
            setStatus({
              isOpen: openNow || false,
              status: 'closed',
              statusText: 'Closed today',
            });
            setLoading(false);
            return;
          }
          
          // Format the opening and closing times
          const formatTime = (timeStr: string) => {
            const hour = parseInt(timeStr.substring(0, 2));
            const minute = timeStr.substring(2);
            const period = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}${minute === '00' ? '' : `:${minute}`}${period}`;
          };
          
          // Format all days' hours
          const formatAllHours = (periods: any[]) => {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const allHours: Record<number, string> = {};
            
            // Initialize with closed for all days
            dayNames.forEach((_, index) => {
              allHours[index] = 'Closed';
            });
            
            // Fill in hours for days that have them
            periods.forEach((period: any) => {
              if (period.open && period.close) {
                const day = period.open.day;
                const openTime = formatTime(period.open.time);
                const closeTime = formatTime(period.close.time);
                allHours[day] = `${openTime} - ${closeTime}`;
              }
            });
            
            return allHours;
          };
          
          const openTime = formatTime(todayPeriod.open.time);
          const closeTime = formatTime(todayPeriod.close.time);
          const hoursToday = `${openTime} - ${closeTime}`;
          
          // Get hours for all days
          const allHours = formatAllHours(periods);
          
          // Parse opening and closing times with validation
          const parseTimeToMinutes = (timeStr: string): number => {
            if (!timeStr || timeStr.length !== 4) {
              console.error(`Invalid time format: ${timeStr}`);
              return 0;
            }
            const hour = parseInt(timeStr.substring(0, 2));
            const minute = parseInt(timeStr.substring(2));
            if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
              console.error(`Invalid time values: ${timeStr}, hour=${hour}, minute=${minute}`);
              return 0;
            }
            return hour * 60 + minute;
          };
          
          const openTimeMinutes = parseTimeToMinutes(todayPeriod.open.time);
          const closeTimeMinutes = parseTimeToMinutes(todayPeriod.close.time);
          
          // Log the exact times for debugging
          console.log(`${name} hours: opens at ${Math.floor(openTimeMinutes/60)}:${openTimeMinutes%60} (${openTimeMinutes} mins), ` +
                     `closes at ${Math.floor(closeTimeMinutes/60)}:${closeTimeMinutes%60} (${closeTimeMinutes} mins), ` +
                     `current time: ${currentHour}:${currentMinute} (${currentTimeMinutes} mins)`);
          
          
          // Add a larger buffer (15 minutes) to ensure stores show as closed after their closing time
          // This helps account for any time discrepancies or rounding issues
          const bufferMinutes = 15;
          
          // Calculate if open based on current time
          let calculatedIsOpen = false;
          
          // Handle cases where store closes after midnight
          if (closeTimeMinutes < openTimeMinutes) {
            // Store closes after midnight
            calculatedIsOpen = (currentTimeMinutes >= openTimeMinutes) || 
                          (currentTimeMinutes < (closeTimeMinutes - bufferMinutes));
          } else {
            // Normal case (opens and closes on same day)
            calculatedIsOpen = (currentTimeMinutes >= openTimeMinutes) && 
                          (currentTimeMinutes < (closeTimeMinutes - bufferMinutes));
          }
          
          // Check if it's past closing time
          const isPastClosingTime = currentTimeMinutes > closeTimeMinutes - bufferMinutes;
          
          // Determine if currently open
          let isOpen = false;
          
          if (isPastClosingTime && !calculatedIsOpen) {
            // If we've calculated that it should be closed because it's past closing time,
            // override Google's open_now flag
            isOpen = false;
            console.log(`Overriding Google's open status for ${name}: It's past closing time (${Math.floor(closeTimeMinutes/60)}:${String(closeTimeMinutes%60).padStart(2, '0')})`);
          } else if (openNow !== undefined) {
            // If we have explicit open_now from Google and it's not past closing time, use that
            isOpen = openNow;
          } else {
            // Use our calculation
            isOpen = calculatedIsOpen;
            console.log(`${name}: Open status calculated from hours (no explicit open_now flag)`, isOpen);
          }
          
          // Determine status
          let status: 'open' | 'closed' | 'opening-soon' | 'closing-soon' = isOpen ? 'open' : 'closed';
          
          // Check if opening soon (within 1 hour)
          if (!isOpen && (openTimeMinutes - currentTimeMinutes <= 60) && (openTimeMinutes - currentTimeMinutes > 0)) {
            status = 'opening-soon';
          }
          
          // Check if closing soon (within 1 hour)
          if (isOpen && (closeTimeMinutes - currentTimeMinutes <= 60) && (closeTimeMinutes - currentTimeMinutes > 0)) {
            status = 'closing-soon';
          }
          
          setStatus({
            isOpen,
            status,
            statusText: status === 'open' ? 'Open' : status === 'closed' ? 'Closed' : 
                       status === 'opening-soon' ? 'Opening Soon' : 'Closing Soon',
            hoursToday,
            allHours
          });
          
          setLoading(false);
          return;
        } catch (err) {
          console.error(`Error processing business hours for ${name}:`, err);
          // Fall through to next option
        }
      }
      
      // If we have a place ID but no business hours, try to fetch from API
      if (placeId) {
        const fetchFromApi = async () => {
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
            useMockData();
          } finally {
            setLoading(false);
          }
        };
        
        fetchFromApi();
        return;
      }
      
      // If we don't have business hours or place ID, use mock data
      useMockData();
    };
    
    // Helper function for mock data
    const useMockData = () => {
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Most cafes are open from 7am to 7pm on weekdays, 8am to 6pm on weekends
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const openingHour = isWeekend ? 8 : 7;
      const closingHour = isWeekend ? 18 : 19;
      
      const isOpen = hour >= openingHour && hour < closingHour;
      let status: 'open' | 'closed' | 'opening-soon' | 'closing-soon' = isOpen ? 'open' : 'closed';
      
      // Opening soon if within 1 hour of opening
      if (!isOpen && hour === openingHour - 1) {
        status = 'opening-soon';
      }
      
      // Closing soon if within 1 hour of closing
      if (isOpen && hour === closingHour - 1) {
        status = 'closing-soon';
      }
      
      const hoursToday = `${openingHour}${openingHour < 12 ? 'AM' : 'PM'} - ${closingHour > 12 ? closingHour - 12 : closingHour}${closingHour < 12 ? 'AM' : 'PM'}`;
      
      // Create mock hours for all days
      const allHours: Record<number, string> = {};
      for (let i = 0; i < 7; i++) {
        const isWeekend = i === 0 || i === 6; // Sunday or Saturday
        const mockOpenHour = isWeekend ? 8 : 7;
        const mockCloseHour = isWeekend ? 18 : 19;
        allHours[i] = `${mockOpenHour}${mockOpenHour < 12 ? 'AM' : 'PM'} - ${mockCloseHour > 12 ? mockCloseHour - 12 : mockCloseHour}${mockCloseHour < 12 ? 'AM' : 'PM'}`;
      }
      
      setStatus({
        isOpen,
        status,
        statusText: status === 'open' ? 'Open' : status === 'closed' ? 'Closed' : status === 'opening-soon' ? 'Opening Soon' : 'Closing Soon',
        hoursToday,
        allHours
      });
      
      setLoading(false);
    };

    determineOpeningStatus();
  }, [placeId, name, businessHours]);

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
    // Fallback to just showing nothing
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

  
  // Check if business hours are available
  const hasBusinessHours = status.allHours && Object.values(status.allHours).some(hours => hours !== 'Closed');

  return (
    <div className="relative">
      <div className="flex items-center text-xs text-gray-600">
        {!hasBusinessHours ? (
          <span className="text-red-600 font-medium">Temporarily Closed</span>
        ) : (
          <>
            {getStatusDisplay()}
            {status.hoursToday && (
              <span className="ml-1">· {status.hoursToday}</span>
            )}
            <button 
              onClick={() => setShowAllHours(!showAllHours)}
              className="ml-1 text-amber-600 hover:text-amber-800 focus:outline-none"
              aria-label="Toggle all hours"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showAllHours ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </>
        )}
      </div>
      
      {/* Dropdown for all hours - only show when business hours are available */}
      {showAllHours && hasBusinessHours && status.allHours && (
        <div className="absolute z-10 mt-1 bg-white shadow-lg rounded-md border border-gray-200 p-2 text-xs w-48 animate-fadeIn">
          <div className="font-medium text-gray-700 mb-1 pb-1 border-b border-gray-100">
            Business Hours
          </div>
          <div className="space-y-1">
            {dayNames.map((day, index) => (
              <div key={day} className="flex justify-between hover:bg-gray-50 px-2 py-1 rounded-sm">
                <span className={`font-medium ${index === new Date().getDay() ? 'text-amber-600' : ''}`}>{day}:</span>
                <span className="text-gray-600">{status.allHours?.[index] || 'Closed'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CafeOpeningHours;
