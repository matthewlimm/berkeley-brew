import { NextRequest, NextResponse } from 'next/server';

// Google Places API key
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');
    
    if (!placeId) {
      return NextResponse.json(
        { status: 'error', message: 'Place ID is required' },
        { status: 400 }
      );
    }
    
    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { status: 'error', message: 'Google Maps API key is not configured' },
        { status: 500 }
      );
    }
    
    // Call Google Places API to get details including opening hours
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=opening_hours,name&key=${GOOGLE_MAPS_API_KEY}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );
    
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      return NextResponse.json(
        { status: 'error', message: `Google Places API error: ${data.status}` },
        { status: 500 }
      );
    }
    
    const placeDetails = data.result;
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
    const isOpen = openingHours.open_now || false;
    
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
