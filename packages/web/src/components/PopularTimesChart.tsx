'use client';

import React from 'react';

interface DayData {
  name: string;
  data: number[];
}

interface PopularTimesData {
  populartimes?: DayData[];
  popular_times?: DayData[];
}

interface PopularTimesChartProps {
  data: any; // Accept any type from the database
  selectedDay?: number; // 0 = Monday, 1 = Tuesday, etc.
  hasLiveData?: boolean; // Whether live data is available
  // Mobile-only adjustments: when true, use tighter, wrapped legend and padded caption
  mobileCompactLegend?: boolean;
  // Legend style: default "dots"; use "gradient" to show a gradient bar legend
  legendStyle?: 'dots' | 'gradient';
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const PopularTimesChart: React.FC<PopularTimesChartProps> = ({ 
  data, 
  selectedDay: initialSelectedDay = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1, // Default to current day (0 = Monday in our data)
  hasLiveData = false,
  mobileCompactLegend = false,
  legendStyle = 'gradient'
}) => {
  // State for selected day
  const [selectedDay, setSelectedDay] = React.useState(initialSelectedDay);
  console.log('PopularTimesChart received raw data:', data);
  console.log('Data type:', typeof data);
  
  // Day selector dropdown component
  const DaySelector = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    return (
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center text-xs text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-500 rounded-md px-2 py-1 transition-colors"
        >
          <span>{daysOfWeek[selectedDay]}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ml-1 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="absolute z-10 right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
            {daysOfWeek.map((day, index) => (
              <button
                key={day}
                onClick={() => {
                  setSelectedDay(index);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-3 py-1.5 text-xs transition-colors ${selectedDay === index 
                  ? 'bg-amber-50 text-amber-700 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50'}`}
              >
                {day}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // Parse and normalize data
  let hourlyData: number[] | null = null;
  
  try {
    // Handle string data (needs parsing)
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        console.log('Parsed string data:', parsed);
        
        // Extract data from parsed object
        if (parsed) {
          // Handle various data structures
          if (Array.isArray(parsed)) {
            // Direct array of days
            if (parsed[selectedDay] && parsed[selectedDay].data) {
              hourlyData = parsed[selectedDay].data;
            }
          } else if (parsed.populartimes && Array.isArray(parsed.populartimes)) {
            // Object with populartimes array
            if (parsed.populartimes[selectedDay] && parsed.populartimes[selectedDay].data) {
              hourlyData = parsed.populartimes[selectedDay].data;
            }
          } else if (parsed.popular_times && Array.isArray(parsed.popular_times)) {
            // Object with popular_times array
            if (parsed.popular_times[selectedDay] && parsed.popular_times[selectedDay].data) {
              hourlyData = parsed.popular_times[selectedDay].data;
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse string data:', e, data);
      }
    } 
    // Handle object data (already parsed)
    else if (data && typeof data === 'object') {
      console.log('Processing object data:', data);
      
      // Handle various data structures
      if (Array.isArray(data)) {
        // Direct array of days
        console.log('Data is an array, length:', data.length);
        if (data[selectedDay] && data[selectedDay].data) {
          hourlyData = data[selectedDay].data;
          console.log('Found hourly data in array format:', hourlyData);
        }
      } else {
        // Check for populartimes property
        if (data.populartimes && Array.isArray(data.populartimes)) {
          console.log('Found populartimes array:', data.populartimes.length);
          if (data.populartimes[selectedDay] && data.populartimes[selectedDay].data) {
            hourlyData = data.populartimes[selectedDay].data;
            console.log('Found hourly data in populartimes format:', hourlyData);
          }
        } 
        // Check for popular_times property
        else if (data.popular_times && Array.isArray(data.popular_times)) {
          console.log('Found popular_times array:', data.popular_times.length);
          if (data.popular_times[selectedDay] && data.popular_times[selectedDay].data) {
            hourlyData = data.popular_times[selectedDay].data;
            console.log('Found hourly data in popular_times format:', hourlyData);
          }
        }
      }
    }
    
    // If we still don't have data, try to extract it directly
    if (!hourlyData && data) {
      // Last resort: try to access the data property directly
      console.log('Trying direct data access as last resort');
      if (data.data && Array.isArray(data.data)) {
        hourlyData = data.data;
        console.log('Found direct data array:', hourlyData);
      }
    }
    
  } catch (error) {
    console.error('Error processing popular times data:', error);
  }
  
  // Check if this is mock data (all zeros) or no valid data
  const isMockData = hourlyData && Array.isArray(hourlyData) && 
    hourlyData.length > 0 && hourlyData.every(val => val === 0);
  
  // If we don't have valid hourly data or it's all zeros (mock data), show greyed out version with same layout
  if (!hourlyData || !Array.isArray(hourlyData) || hourlyData.length === 0 || isMockData) {
    console.error('No valid hourly data found or using mock data');
    return (
      <div className="w-full popular-times-container h-[260px] flex flex-col p-4 mb-2 bg-white rounded-lg shadow-sm border border-gray-200 relative">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-800">Popular Times</h3>
          <DaySelector />
        </div>
        
        {/* Status indicator - same as data version */}
        <div className="flex items-center mb-2 px-2 py-1 bg-gray-50 rounded-md inline-block w-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-300 mr-2"></div>
          <span className="text-xs text-gray-500 font-medium">No live data available</span>
        </div>
        
        {/* Google-style bar chart with same structure as data version */}
        <div className="flex flex-col">
          <div className="relative h-20 w-full">
            {/* Horizontal grid lines */}
            <div className="absolute top-0 w-full border-t border-gray-200"></div>
            <div className="absolute top-1/3 w-full border-t border-gray-200"></div>
            <div className="absolute top-2/3 w-full border-t border-gray-200"></div>
            <div className="absolute bottom-0 w-full border-t border-gray-200"></div>
            
            {/* Greyed out bars using same scale as data */}
            <div className="absolute top-0 bottom-0 left-0 right-0 flex items-end">
              {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map(hour => {
                // Generate realistic mock values between 20-80
                const mockValue = Math.floor(Math.random() * 60) + 20;
                // Use same height calculation as data state
                const heightPx = Math.max(4, Math.round((mockValue / 100) * 60));
                
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center px-0.5">
                    <div className="h-full flex items-end justify-center w-full">
                      <div 
                        className="w-3/5 bg-gray-200 rounded-sm transition-all duration-300"
                        style={{ height: `${heightPx}px` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Time labels - same spacing as data version */}
          <div className="flex mt-3 mb-2 px-3">
            {[6, 9, 12, 15, 18, 21].map(hour => (
              <div key={hour} className="flex-1 text-center">
                <span className="text-xs font-medium text-gray-600 px-1">
                  {hour % 12 || 12}{hour < 12 ? 'a' : 'p'}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="w-full mb-1">
            <div
              className="h-2 rounded-full w-full"
              style={{
                background: 'linear-gradient(to right, #cbd5e1, #7dd3fc, #d8b4fe, #fcd34d, #fca5a5)'
              }}
            />
            <div className="mt-1 flex justify-between text-[11px] sm:text-xs">
              <span className="text-slate-600">Quiet</span>
              <span className="text-cyan-600">Not busy</span>
              <span className="text-purple-600">Getting busy</span>
              <span className="text-amber-600">Very busy</span>
              <span className="text-rose-600">Peak</span>
            </div>
          </div>

          <div className={`text-[11px] sm:text-xs text-gray-400 text-center italic pb-2 px-2`}>
            Based on Google Maps popular times data
          </div>
        </div>

        {/* Overlay for no data */}
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-xs font-medium text-gray-600">No popular times data available</p>
          </div>
        </div>
      </div>
    );
  }
  
  console.log('Rendering chart with hourly data:', hourlyData);
  
  // Find the current hour (0-23)
  const currentHour = new Date().getHours();
  
  // Calculate dynamic busyness thresholds based on actual data
  const validValues = hourlyData.filter(v => typeof v === 'number' && v > 0);
  const minValue = validValues.length > 0 ? Math.min(...validValues) : 0;
  const maxValue = validValues.length > 0 ? Math.max(...validValues) : 100;
  const range = maxValue - minValue;
  
  // Create dynamic thresholds based on data distribution
  const threshold25 = minValue + (range * 0.25);
  const threshold50 = minValue + (range * 0.50);
  const threshold75 = minValue + (range * 0.75);
  const threshold90 = minValue + (range * 0.90);
  
  // Function to get busyness level and label based on dynamic thresholds
  // Using colorblind-friendly palette with good contrast
  const getBusynessInfo = (value: number) => {
    if (value <= threshold25) {
      return {
        level: 'quiet',
        label: 'Quiet time',
        color: 'bg-slate-400',
        dotColor: 'bg-slate-500',
        textColor: 'text-slate-700'
      };
    } else if (value <= threshold50) {
      return {
        level: 'low',
        label: 'Usually not busy',
        color: 'bg-cyan-400',
        dotColor: 'bg-cyan-500',
        textColor: 'text-cyan-700'
      };
    } else if (value <= threshold75) {
      return {
        level: 'moderate',
        label: 'Getting busy',
        color: 'bg-purple-400',
        dotColor: 'bg-purple-500',
        textColor: 'text-purple-700'
      };
    } else if (value <= threshold90) {
      return {
        level: 'busy',
        label: 'Very busy',
        color: 'bg-amber-400',
        dotColor: 'bg-amber-500',
        textColor: 'text-amber-700'
      };
    } else {
      return {
        level: 'peak',
        label: 'As busy as it gets',
        color: 'bg-rose-600',
        dotColor: 'bg-rose-600',
        textColor: 'text-rose-700'
      };
    }
  };

  // Component already defined above

  return (
    <div className="w-full popular-times-container h-[260px] flex flex-col p-4 mb-2 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-800">Popular Times</h3>
        <DaySelector />
      </div>
      
      {/* Current status indicator */}
      <div className="flex items-center mb-2 px-2 py-1 bg-gray-50 rounded-md inline-block w-auto">
        {(() => {
          console.log('=== LIVE DATA DEBUG ===');
          console.log('PopularTimesChart - hasLiveData prop:', hasLiveData);
          console.log('PopularTimesChart - hourlyData:', hourlyData);
          console.log('PopularTimesChart - currentHour:', currentHour);
          console.log('PopularTimesChart - hourlyData length:', hourlyData?.length);
          
          // Show live status if we have valid hourly data (regardless of hasLiveData prop)
          if (hourlyData && Array.isArray(hourlyData) && hourlyData.length > 0) {
            // Get current hour's busyness level
            const currentValue = hourlyData[currentHour] || 0;
            console.log('PopularTimesChart - currentValue at hour', currentHour, ':', currentValue);
            
            // Use dynamic thresholds for live status
            const busynessInfo = getBusynessInfo(currentValue);
            const liveLabel = busynessInfo.label + ' right now';
            
            console.log('PopularTimesChart - Showing live status:', liveLabel, 'with color:', busynessInfo.dotColor);
            
            return (
              <>
                <div className={`w-2.5 h-2.5 rounded-full ${busynessInfo.dotColor} animate-pulse mr-2`}></div>
                <span className={`text-xs ${busynessInfo.textColor} font-medium`}>{liveLabel}</span>
              </>
            );
          } else {
            console.log('PopularTimesChart - No valid hourly data, showing no live data');
            return (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300 mr-2"></div>
                <span className="text-xs text-gray-500 font-medium">No live data available</span>
              </>
            );
          }
        })()}
      </div>
      
      {/* Google-style bar chart with subtle grid lines */}
      <div className="flex flex-col">
        <div className="relative h-20 w-full">
          {/* Horizontal grid lines */}
          <div className="absolute top-0 w-full border-t border-gray-200"></div>
          <div className="absolute top-1/3 w-full border-t border-gray-200"></div>
          <div className="absolute top-2/3 w-full border-t border-gray-200"></div>
          <div className="absolute bottom-0 w-full border-t border-gray-200"></div>
          
          {/* Bars */}
          <div className="absolute top-0 bottom-0 left-0 right-0 flex items-end">
            {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map(hour => {
              // Get the value for this hour
              const value = hourlyData[hour] || 0;
              
              // Use dynamic thresholds for bar color
              const busynessInfo = getBusynessInfo(value);
              
              // Calculate height - use relative scaling based on max value for better visibility
              const heightPx = Math.max(4, Math.round((value / maxValue) * 60));
              
              // Highlight current hour
              const isCurrentHour = hour === currentHour;
              const highlightClass = isCurrentHour ? 'border-2 border-blue-500 shadow-md' : '';
              
              return (
                <div key={hour} className="flex-1 flex flex-col items-center px-0.5">
                  <div className="h-full flex items-end justify-center w-full">
                    <div 
                      className={`w-3/5 ${busynessInfo.color} rounded-sm ${highlightClass} transition-all duration-300 hover:opacity-80`}
                      style={{ 
                        height: `${heightPx}px`,
                      }}
                      title={`${hour}:00 - ${busynessInfo.label} (${value}% busy)`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Time labels - only show at intervals */}
        <div className="flex mt-3 mb-2 px-3">
          {[6, 9, 12, 15, 18, 21].map(hour => (
            <div key={hour} className="flex-1 text-center">
              <span className="text-xs font-medium text-gray-600 px-1">
                {hour % 12 || 12}{hour < 12 ? 'a' : 'p'}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      {legendStyle === 'gradient' ? (
        <div className="w-full mb-1">
          <div
            className="h-2 rounded-full w-full"
            style={{
              background: 'linear-gradient(to right, #cbd5e1, #7dd3fc, #d8b4fe, #fcd34d, #fca5a5)'
            }}
          />
          <div className="mt-1 flex justify-between text-[11px] sm:text-xs">
            <span className="text-slate-600">Quiet</span>
            <span className="text-cyan-600">Not busy</span>
            <span className="text-purple-600">Getting busy</span>
            <span className="text-amber-600">Very busy</span>
            <span className="text-rose-600">Peak</span>
          </div>
        </div>
      ) : (
        <div className={`${mobileCompactLegend ? 'flex flex-wrap justify-between gap-x-3 gap-y-1 mb-2 text-[11px] sm:text-xs text-gray-600 px-1 sm:px-0' : 'flex justify-between mb-2 text-xs text-gray-600'}`}>
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-slate-500 rounded-full mr-1 shadow-sm"></span>
            <span>Quiet</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full mr-1 shadow-sm"></span>
            <span>Not busy</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-1 shadow-sm"></span>
            <span>Getting busy</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-1 shadow-sm"></span>
            <span>Very busy</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-rose-600 rounded-full mr-1 shadow-sm"></span>
            <span>Peak</span>
          </div>
        </div>
      )}
      
      <div className={`text-[11px] sm:text-xs text-gray-400 text-center italic pb-2 px-2`}>
        Based on Google Maps popular times data
      </div>
    </div>
  );
};

export default PopularTimesChart;
