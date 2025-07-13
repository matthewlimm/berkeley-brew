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
              <Link href="/" className="flex items-center group">
                <div className="relative">
                  {/* Go Bears tooltip */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    Go Bears! 🐻
                  </div>
                  <Image
                    src="/logo.png"
                    alt="Berkeley Brew Logo"
                    width={80}
                    height={80}
                    className="h-20 w-20 group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="flex flex-col -ml-2">
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
