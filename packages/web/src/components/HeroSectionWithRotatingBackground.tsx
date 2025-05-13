'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Sample data for the rotating backgrounds
// In a real app, you would fetch this from your API
const CAFE_BACKGROUNDS = [
  {
    id: 1,
    name: 'Strada Coffee',
    location: 'Bancroft Way',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
  },
  {
    id: 2,
    name: '1951 Coffee Company',
    location: 'Channing Way',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
  },
  {
    id: 3,
    name: 'Yali\'s Café',
    location: 'Oxford Street',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
  },
  {
    id: 4,
    name: 'Equator Coffees',
    location: 'Shattuck Avenue',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
  },
  {
    id: 5,
    name: 'Souvenir Coffee',
    location: 'Claremont Avenue',
    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
  },
];

export default function HeroSectionWithRotatingBackground() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Rotate through backgrounds every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % CAFE_BACKGROUNDS.length);
        setIsTransitioning(false);
      }, 250); // Faster fade transition (250ms)
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  const currentCafe = CAFE_BACKGROUNDS[currentIndex];

  return (
    <div className="relative h-[500px] md:h-[600px] overflow-hidden">
      {/* Black overlay for transition */}
      <div 
        className={`absolute inset-0 bg-black z-20 transition-opacity duration-500 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${currentCafe.image})`,
        }}
      />
      
      {/* Location Label */}
      <div className={`absolute bottom-6 right-6 md:bottom-10 md:right-10 z-30 transition-opacity duration-500 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <div className="bg-black bg-opacity-70 rounded-full px-4 py-2 shadow-md">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-white">{currentCafe.name} · {currentCafe.location}</span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-30 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              <span className="block">Discover the Best Coffee</span>
              <span className="block text-amber-300">in Berkeley</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-200 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Find your perfect study spot, meet-up location, or caffeine fix from the best local cafes around campus.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link href="/cafes" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-gray-900 bg-amber-400 hover:bg-amber-300 md:py-4 md:text-lg md:px-10">
                  Browse Cafes
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link href="/posts" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-800 bg-opacity-60 hover:bg-opacity-70 md:py-4 md:text-lg md:px-10">
                  View Posts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Dots removed as requested */}
    </div>
  );
}
