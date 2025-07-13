'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import UserProfileMenu from '../UserProfileMenu';

interface MainLayoutProps {
  children: React.ReactNode;
  isDashboardLayout?: boolean;
}

export default function MainLayout({ children, isDashboardLayout = false }: MainLayoutProps) {
  const { user, signOut } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {  
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 group-hover:scale-105 transition-transform duration-200" viewBox="0 0 120 120">
                    <defs>
                      <linearGradient id="bearGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B4513" />
                        <stop offset="100%" stopColor="#A0522D" />
                      </linearGradient>
                      <linearGradient id="cupGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#D97706" />
                        <stop offset="100%" stopColor="#92400E" />
                      </linearGradient>
                      <linearGradient id="steamGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#E5E7EB" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#F3F4F6" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>
                    
                    {/* Coffee cup base */}
                    <path d="M75 65 L85 65 Q90 65 90 70 L90 80 Q90 85 85 85 L75 85 Z" fill="url(#cupGradient)" stroke="#92400E" strokeWidth="1"/>
                    
                    {/* Coffee cup handle */}
                    <path d="M85 70 Q95 70 95 75 Q95 80 85 80" fill="none" stroke="url(#cupGradient)" strokeWidth="2.5" strokeLinecap="round"/>
                    
                    {/* Steam wisps */}
                    <path d="M77 62 Q79 58 77 54 Q75 50 77 46" fill="none" stroke="url(#steamGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
                    <path d="M80 62 Q82 58 80 54 Q78 50 80 46" fill="none" stroke="url(#steamGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                    <path d="M83 62 Q85 58 83 54 Q81 50 83 46" fill="none" stroke="url(#steamGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                    
                    {/* Bear silhouette - simplified and more stylized */}
                    <circle cx="45" cy="60" r="28" fill="url(#bearGradient)"/>
                    
                    {/* Bear ears */}
                    <circle cx="30" cy="42" r="8" fill="url(#bearGradient)"/>
                    <circle cx="60" cy="42" r="8" fill="url(#bearGradient)"/>
                    <circle cx="30" cy="44" r="4" fill="#CD853F"/>
                    <circle cx="60" cy="44" r="4" fill="#CD853F"/>
                    
                    {/* Bear facial features - minimalist */}
                    <circle cx="38" cy="55" r="2.5" fill="#2D1810"/>
                    <circle cx="52" cy="55" r="2.5" fill="#2D1810"/>
                    <ellipse cx="45" cy="65" rx="3" ry="2" fill="#2D1810"/>
                    
                    {/* Subtle bear smile */}
                    <path d="M40 70 Q45 73 50 70" fill="none" stroke="#2D1810" strokeWidth="1.5" strokeLinecap="round"/>
                    
                    {/* Coffee beans accent */}
                    <ellipse cx="25" cy="85" rx="3" ry="5" fill="#8B4513" transform="rotate(25 25 85)"/>
                    <path d="M25 83 L25 87" stroke="#654321" strokeWidth="0.5"/>
                    <ellipse cx="35" cy="90" rx="2.5" ry="4" fill="#8B4513" transform="rotate(-15 35 90)"/>
                    <path d="M35 88 L35 92" stroke="#654321" strokeWidth="0.5"/>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-800 group-hover:text-amber-700 transition-colors duration-200">Berkeley Brew</span>
                  <span className="text-xs text-amber-600 font-medium -mt-1">Cafe Discovery</span>
                </div>
              </Link>
            </div>

            {/* Mobile menu button */}
            {isMobile && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500"
              >
                <span className="sr-only">Open main menu</span>
                {/* Hamburger icon */}
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            {/* Desktop navigation */}
            {!isMobile && (
              <div className="hidden md:ml-6 md:flex md:space-x-8">
              </div>
            )}

            {/* User authentication */}
            <div className="ml-6 flex items-center">
              {user ? (
                <UserProfileMenu />
              ) : (
                <div className="flex space-x-4 items-center">
                  <Link href="/auth/login" className="text-amber-600 hover:text-amber-500 font-medium px-4 py-2">
                    Login
                  </Link>
                  <Link href="/auth/signup" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {isMobile && menuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-500 text-sm">&copy; 2025 Berkeley Brew. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/about" className="text-gray-500 hover:text-gray-700 text-sm">
                About
              </Link>
              <Link href="/contact" className="text-gray-500 hover:text-gray-700 text-sm">
                Contact
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-gray-700 text-sm">
                Terms
              </Link>
              <Link href="/privacy" className="text-gray-500 hover:text-gray-700 text-sm">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      {isMobile && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex">

          <Link href="/dashboard" className="flex-1 flex flex-col items-center justify-center py-2 text-xs text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Profile</span>
          </Link>
        </div>
      )}
    </div>
  );
}
