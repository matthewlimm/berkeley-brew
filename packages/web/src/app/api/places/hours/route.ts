import { NextRequest, NextResponse } from 'next/server';

// Google Places API key
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Mark this route as dynamic since it uses search parameters
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const placeId = searchParams.get('placeId');
    
    if (!placeId) {
      return NextResponse.json(
        { status: 'error', message: 'Place ID is required' },
        { status: 400 }
      );
    }
    
    if (!GOOGLE_MAPS_API_KEY) {
      // Graceful fallback to avoid client 500s when key isn't configured
      return NextResponse.json({
        status: 'success',
        data: {
          isOpen: false,
          status: 'closed',
          statusText: 'Hours not available',
          hoursToday: undefined,
        }
      }, { status: 200 });
    }
    
    // Call Google Places API to get details including opening hours
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=opening_hours,name&key=${GOOGLE_MAPS_API_KEY}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );
    
    if (!response.ok) {
      // Graceful fallback when Google responds with HTTP error
      return NextResponse.json({
        status: 'success',
        data: {
          isOpen: false,
          status: 'closed',
          statusText: 'Hours not available',
          hoursToday: undefined,
        }
      }, { status: 200 });
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      // Graceful fallback instead of 500 to avoid noisy client errors
      return NextResponse.json({
        status: 'success',
        data: {
          isOpen: false,
          status: 'closed',
          statusText: 'Hours not available',
          hoursToday: undefined,
        }
      }, { status: 200 });
    }
    
    const placeDetails = data.result;
    const placeName = placeDetails?.name || 'Unknown place';
    const openingHours = placeDetails.opening_hours;
    
    if (!openingHours) {
      return NextResponse.json({
        status: 'success',
        data: {
          isOpen: false,
          status: 'unknown',
          statusText: 'Hours not available'
        }
      });
    }
    
    // Get current day's hours
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Get today's hours from the periods array
    const todayHours = openingHours.periods.find(
      (period: any) => period.open.day === currentDay
    );
    
    // Format hours for display
    const formatTime = (timeStr: string) => {
      const hour = parseInt(timeStr.substring(0, 2));
      const minute = timeStr.substring(2);
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}${minute === '00' ? '' : `:${minute}`}${period}`;
    };
    
    let hoursToday;
    if (todayHours && todayHours.open && todayHours.close) {
      const openTime = formatTime(todayHours.open.time);
      const closeTime = formatTime(todayHours.close.time);
      hoursToday = `${openTime} - ${closeTime}`;
    }
    
    // Check if the place is currently open
    // First try to use Google's open_now flag if available
    let isOpen = openingHours.open_now || false;
    
    // If we have today's hours, calculate open status as a fallback or verification
    if (todayHours && todayHours.open && todayHours.close) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      
      // Parse opening and closing times
      const openHour = parseInt(todayHours.open.time.substring(0, 2));
      const openMinute = parseInt(todayHours.open.time.substring(2));
      const openTimeMinutes = openHour * 60 + openMinute;
      
      const closeHour = parseInt(todayHours.close.time.substring(0, 2));
      const closeMinute = parseInt(todayHours.close.time.substring(2));
      const closeTimeMinutes = closeHour * 60 + closeMinute;
      
      // Calculate if open based on current time
      let calculatedIsOpen = false;
      
      // Add a larger buffer (15 minutes) to ensure stores show as closed after their closing time
      // This helps account for any time discrepancies or rounding issues
      const bufferMinutes = 15;
      
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
      
      // Always prioritize our calculation when it shows closed after the closing time
      // This ensures cafes don't show as open after their closing hours
      const isPastClosingTime = currentTimeMinutes > closeTimeMinutes - bufferMinutes;
      
      if (isPastClosingTime && !calculatedIsOpen) {
        // If we've calculated that it should be closed because it's past closing time,
        // override Google's open_now flag
        isOpen = false;
        console.log(`Overriding Google's open status for ${placeName}: It's past closing time (${Math.floor(closeTimeMinutes/60)}:${String(closeTimeMinutes%60).padStart(2, '0')})`);
      } else if (openingHours.open_now === undefined) {
        // If Google's open_now is undefined, use our calculation
        isOpen = calculatedIsOpen;
      } else if (openingHours.open_now !== calculatedIsOpen) {
        // Log discrepancy for debugging but don't override in other cases
        console.log(`Discrepancy for ${placeName}: Google says ${openingHours.open_now ? 'open' : 'closed'}, calculation says ${calculatedIsOpen ? 'open' : 'closed'}`);
      }
    }
    
    // Determine if it's "opening soon" or "closing soon" (within 1 hour)
    let status: 'open' | 'closed' | 'opening-soon' | 'closing-soon' = isOpen ? 'open' : 'closed';
    
    if (todayHours && todayHours.open && todayHours.close) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      
      // Parse opening and closing times
      const openHour = parseInt(todayHours.open.time.substring(0, 2));
      const openMinute = parseInt(todayHours.open.time.substring(2));
      const openTimeMinutes = openHour * 60 + openMinute;
      
      const closeHour = parseInt(todayHours.close.time.substring(0, 2));
      const closeMinute = parseInt(todayHours.close.time.substring(2));
      const closeTimeMinutes = closeHour * 60 + closeMinute;
      
      // Check if opening soon (within 1 hour)
      if (!isOpen && (openTimeMinutes - currentTimeMinutes <= 60) && (openTimeMinutes - currentTimeMinutes > 0)) {
        status = 'opening-soon';
      }
      
      // Check if closing soon (within 1 hour)
      if (isOpen && (closeTimeMinutes - currentTimeMinutes <= 60) && (closeTimeMinutes - currentTimeMinutes > 0)) {
        status = 'closing-soon';
      }
    }
    
    // Create status text
    let statusText;
    switch (status) {
      case 'open':
        statusText = 'Open';
        break;
      case 'closed':
        statusText = 'Closed';
        break;
      case 'opening-soon':
        statusText = 'Opening Soon';
        break;
      case 'closing-soon':
        statusText = 'Closing Soon';
        break;
    }
    
    return NextResponse.json({
      status: 'success',
      data: {
        isOpen,
        status,
        statusText,
        hoursToday
      }
    });
    
  } catch (error) {
    console.error('Error fetching place hours:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch opening hours' },
      { status: 500 }
    );
  }
}
