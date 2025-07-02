import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

const UserProfileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-amber-600 transition-colors"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
          {user.user_metadata?.avatar_url ? (
            <Image 
              src={user.user_metadata.avatar_url} 
              alt="Profile" 
              width={32} 
              height={32} 
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-amber-100 flex items-center justify-center text-amber-700">
              {(user.user_metadata?.username || user.email)?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <span className="hidden md:block text-sm font-medium">
          {user.user_metadata?.username || user.email?.split('@')[0] || 'User'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.user_metadata?.name || user.user_metadata?.username || user.email?.split('@')[0]}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          
          <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700">
            Dashboard & Profile
          </Link>
          <Link href="/dashboard/reviews" className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700">
            My Reviews
          </Link>
          <Link href="/dashboard/bookmarks" className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700">
            My Bookmarks
          </Link>
          
          <button
            onClick={() => signOut()}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 border-t border-gray-100"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileMenu;