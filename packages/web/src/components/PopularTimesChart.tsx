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
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const PopularTimesChart: React.FC<PopularTimesChartProps> = ({ 
  data, 
  selectedDay: initialSelectedDay = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1 // Default to current day (0 = Monday in our data)
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
  
  // If we don't have valid hourly data or it's all zeros (mock data), show a greyed out version
  if (!hourlyData || !Array.isArray(hourlyData) || hourlyData.length === 0 || isMockData) {
    console.error('No valid hourly data found or using mock data');
    return (
      <div className="w-full popular-times-container h-[200px] flex flex-col p-4 mb-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-800">Popular Times</h3>
          <DaySelector />
        </div>
        
        {/* Empty placeholder for current status indicator to maintain consistent height */}
        <div className="flex items-center mb-2 px-2 py-1 bg-gray-50 rounded-md inline-block w-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-300 mr-2"></div>
          <span className="text-xs text-gray-500 font-medium">No live data available</span>
        </div>
        
        {/* Empty state with same height as chart */}
        <div className="relative h-20 w-full">
          {/* Horizontal grid lines to match chart */}
          <div className="absolute top-0 w-full border-t border-gray-200"></div>
          <div className="absolute top-1/3 w-full border-t border-gray-200"></div>
          <div className="absolute top-2/3 w-full border-t border-gray-200"></div>
          <div className="absolute bottom-0 w-full border-t border-gray-200"></div>
          
          {/* Greyed out bars */}
          <div className="absolute top-0 bottom-0 left-0 right-0 flex items-end">
            {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map(hour => (
              <div key={hour} className="flex-1 flex flex-col items-center px-0.5">
                <div className="h-full flex items-end justify-center w-full">
                  <div 
                    className="w-3/5 bg-gray-200 rounded-sm transition-all duration-300"
                    style={{ height: `${Math.random() * 10 + 5}px` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Time labels - maintain same layout as chart view */}
        <div className="flex mt-3 mb-2 px-3">
          {[6, 9, 12, 15, 18, 21].map(hour => (
            <div key={hour} className="flex-1 text-center">
              <span className="text-xs font-medium text-gray-400 px-1">
                {hour % 12 || 12}{hour < 12 ? 'a' : 'p'}
              </span>
            </div>
          ))}
        </div>
        
        {/* Legend to match chart view but greyed out - positioned exactly like the data state */}
        <div className="flex justify-between text-xs text-gray-400">
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1 shadow-sm"></span>
            <span>Not busy</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1 shadow-sm"></span>
            <span>Busy</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1 shadow-sm"></span>
            <span>Very busy</span>
          </div>
        </div>
        
        {/* Footer text to match chart view - positioned exactly like the data state */}
        <div className="text-xs text-gray-400 text-center italic">
          Based on Google Maps popular times data
        </div>
      </div>
    );
  }
  
  console.log('Rendering chart with hourly data:', hourlyData);
  
  // Find the current hour (0-23)
  const currentHour = new Date().getHours();
  
  // Calculate the max value for scaling
  const maxValue = Math.max(...hourlyData.filter(v => typeof v === 'number'), 1); // Ensure we don't divide by zero

  // Component already defined above

  return (
    <div className="w-full popular-times-container h-[200px] flex flex-col p-4 mb-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-800">Popular Times</h3>
        <DaySelector />
      </div>
      
      {/* Current status indicator */}
      {currentHour >= 6 && currentHour <= 22 && hourlyData[currentHour] !== undefined && (
        <div className="flex items-center mb-2 px-2 py-1 bg-blue-50 rounded-md inline-block w-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
          <span className="text-xs text-blue-700 font-medium">
            Live: {hourlyData[currentHour] < 30 ? 'Not busy' : hourlyData[currentHour] < 70 ? 'A little busy' : 'Very busy'}
          </span>
        </div>
      )}
      
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
              
              // Determine color based on busyness
              let barColor;
              if (value < 30) barColor = 'bg-green-400';
              else if (value < 70) barColor = 'bg-yellow-400';
              else barColor = 'bg-red-400';
              
              // Calculate height - use fixed heights for better visibility
              const heightPx = Math.max(4, Math.round((value / 100) * 60));
              
              // Highlight current hour
              const isCurrentHour = hour === currentHour;
              const highlightClass = isCurrentHour ? 'border-2 border-blue-500 shadow-md' : '';
              
              return (
                <div key={hour} className="flex-1 flex flex-col items-center px-0.5">
                  <div className="h-full flex items-end justify-center w-full">
                    <div 
                      className={`w-3/5 ${barColor} rounded-sm ${highlightClass} transition-all duration-300 hover:opacity-80`}
                      style={{ 
                        height: `${heightPx}px`,
                      }}
                      title={`${hour}:00 - ${value}% busy`}
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
      
      <div className="flex justify-between mb-4 text-xs text-gray-600">
        <div className="flex items-center">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 shadow-sm"></span>
          <span>Not busy</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-1 shadow-sm"></span>
          <span>Busy</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1 shadow-sm"></span>
          <span>Very busy</span>
        </div>
      </div>
      
      <div className="text-xs text-gray-400 text-center italic">
        Based on Google Maps popular times data
      </div>
    </div>
  );
};

export default PopularTimesChart;
