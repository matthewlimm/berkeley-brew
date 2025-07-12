'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UnsplashImage {
  id: string;
  location: string;
  description: string;
  image: string;
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
}

// UC Berkeley images from Unsplash
const INITIAL_BACKGROUNDS: UnsplashImage[] = [
  {
    id: '1',
    location: 'UC Berkeley',
    description: 'Sather Tower (The Campanile)',
    image: 'https://images.unsplash.com/photo-1694391505705-7fde96f6f14f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    photographer: 'Janet Ganbold',
    photographerUrl: 'https://unsplash.com/@j4net999',
    unsplashUrl: 'https://unsplash.com/photos/a-tall-white-building-with-a-steeple-surrounded-by-trees-dLO5xBuYh9k'
  },
  {
    id: '2',
    location: 'Berkeley Hills',
    description: 'Campus View',
    image: 'https://images.unsplash.com/photo-1694391579944-b9162db8162e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    photographer: 'Janet Ganbold',
    photographerUrl: 'https://unsplash.com/@j4net999',
    unsplashUrl: 'https://unsplash.com/photos/a-view-of-a-city-from-a-hill-L2HVcCFyZWQ'
  },
  {
    id: '3',
    location: 'UC Berkeley',
    description: 'Sather Gate at Sundown',
    image: 'https://images.unsplash.com/photo-1671709034123-d816bf151d89?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    photographer: 'Georg Eiermann',
    photographerUrl: 'https://unsplash.com/@georgeiermann',
    unsplashUrl: 'https://unsplash.com/photos/sather-gate-at-sundown'
  },
  {
    id: '4',
    location: 'UC Berkeley',
    description: 'Bear Statues at Engineering Library',
    image: 'https://images.unsplash.com/photo-1638909374742-8c8364010106?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    photographer: 'Jeremy Huang',
    photographerUrl: 'https://unsplash.com/@plover37',
    unsplashUrl: 'https://unsplash.com/photos/a-clock-tower-towering-over-a-lush-green-park-zn7eped3vn0'
  },
  {
    id: '5',
    location: 'UC Berkeley',
    description: 'Berkeley Quad at Sundown',
    image: 'https://images.unsplash.com/photo-1671709363092-60b205ee7e92?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    photographer: 'Georg Eiermann',
    photographerUrl: 'https://unsplash.com/@georgeiermann',
    unsplashUrl: 'https://unsplash.com/photos/a-couple-of-people-sitting-at-a-table-in-a-park-A-FnuOazZcQ'
  },
  {
    id: '6',
    location: 'UC Berkeley',
    description: 'Main Stacks Library Staircase',
    image: 'https://images.unsplash.com/photo-1573587466497-65f8b4e5de05?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    photographer: 'Eden Rushing',
    photographerUrl: 'https://unsplash.com/@edenisbenenne9',
    unsplashUrl: 'https://unsplash.com/photos/empty-staircase-ffe0iwML4TE'
  },
  {
    id: '7',
    location: 'UC Berkeley',
    description: 'South Hall',
    image: 'https://images.unsplash.com/photo-1671709363686-a7899fb1238e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    photographer: 'Georg Eiermann',
    photographerUrl: 'https://unsplash.com/@georgeiermann',
    unsplashUrl: 'https://unsplash.com/photos/a-large-brick-building-with-a-lot-of-windows-vFNY8kdb0vQ'
  },
  {
    id: '8',
    location: 'UC Berkeley',
    description: 'Wheeler Hall',
    image: 'https://images.unsplash.com/photo-1671709363690-9392d9b38949?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    photographer: 'Georg Eiermann',
    photographerUrl: 'https://unsplash.com/@georgeiermann',
    unsplashUrl: 'https://unsplash.com/photos/a-large-building-with-a-clock-tower-on-top-of-it-JkEPHzbGgYA'
  }
];

export default function HeroSectionWithRotatingBackground() {
  const [backgrounds, setBackgrounds] = useState<UnsplashImage[]>(INITIAL_BACKGROUNDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch Berkeley images from Unsplash
  useEffect(() => {
    async function fetchBerkeleyImages() {
      try {
        // Use the Unsplash API to search for Berkeley images
        // In a production app, you would use the official Unsplash API with proper authentication
        // For this demo, we're using a search query to fetch images directly
        const response = await fetch(
          'https://api.unsplash.com/search/photos?query=berkeley+university+california&per_page=10',
          {
            headers: {
              // Note: In production, you should never expose API keys in client-side code
              // This is just for demonstration purposes
              'Authorization': 'Client-ID YOUR_UNSPLASH_ACCESS_KEY'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch images');
        }
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const formattedImages: UnsplashImage[] = data.results.map((img: any) => ({
            id: img.id,
            location: img.location?.name || 'Berkeley, California',
            description: img.description || img.alt_description || 'UC Berkeley Campus',
            image: `${img.urls.raw}&w=1800&q=85&fm=jpg&crop=entropy&cs=srgb`,
            photographer: img.user.name,
            photographerUrl: img.user.links.html,
            unsplashUrl: img.links.html
          }));
          
          setBackgrounds(formattedImages);
        }
      } catch (error) {
        console.error('Error fetching Unsplash images:', error);
        // Keep using the initial backgrounds if there's an error
      } finally {
        setIsLoading(false);
      }
    }
    
    // Since we don't have a real Unsplash API key in this example,
    // we'll just use our initial backgrounds
    // Uncomment the line below if you add a real Unsplash API key
    // fetchBerkeleyImages();
  }, []);
  
  // Rotate through backgrounds every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % backgrounds.length);
        setIsTransitioning(false);
      }, 250); // Faster fade transition (250ms)
    }, 10000);
    
    return () => clearInterval(interval);
  }, [backgrounds.length]);
  
  const currentImage = backgrounds[currentIndex];

  return (
    <div className="relative h-[500px] md:h-[600px] overflow-hidden">
      {/* Black overlay for transition */}
      <div 
        className={`absolute inset-0 bg-black z-20 transition-opacity duration-500 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {/* Background Image with Sepia Filter and Overlay for Readability */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${currentImage.image})`,
          filter: 'sepia(0.6)',
        }}
      />
      
      {/* Semi-transparent overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-40 z-10" />
      
      {/* Location and Attribution Label */}
      <div className={`absolute bottom-6 right-6 md:bottom-10 md:right-10 z-30 transition-opacity duration-500 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <div className="bg-black bg-opacity-70 rounded-lg px-4 py-2 shadow-md">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-white">{currentImage.description} · {currentImage.location}</span>
            </div>
            <div className="text-xs text-gray-300">
              Photo by {currentImage.photographer} on Unsplash
            </div>
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
              Find your perfect study spot, coffee chat, or caffeine fix from the best local cafes around campus.
            </p>
            {/* Buttons removed as requested */}
          </div>
        </div>
      </div>
      
      {/* Navigation Dots removed as requested */}
    </div>
  );
}
