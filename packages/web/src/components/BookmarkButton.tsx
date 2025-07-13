'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useBookmarks } from '@/contexts/BookmarkContext'
import { BookmarkIcon as BookmarkOutlineIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'

interface BookmarkButtonProps {
  cafeId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  onBookmarkChange?: (cafeId: string, isBookmarked: boolean) => void
}

export default function BookmarkButton({ cafeId, className = '', size = 'md', showText = false, onBookmarkChange }: BookmarkButtonProps) {
  const { user } = useAuth()
  const { isBookmarked, addBookmark, removeBookmark, isLoading } = useBookmarks()

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const toggleBookmark = async () => {
    if (!user) {
      // Redirect to login or show login prompt
      alert('Please log in to bookmark cafes')
      return
    }

    try {
      const wasBookmarked = isBookmarked(cafeId)
      if (wasBookmarked) {
        await removeBookmark(cafeId)
        // Call callback with new state (now unbookmarked)
        onBookmarkChange?.(cafeId, false)
      } else {
        await addBookmark(cafeId)
        // Call callback with new state (now bookmarked)
        onBookmarkChange?.(cafeId, true)
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err)
      alert('There was an error updating your bookmark. Please try again.')
    }
  }

  const bookmarked = isBookmarked(cafeId)
  
  return (
    <button
      onClick={toggleBookmark}
      disabled={isLoading}
      className={`flex items-center transition-colors ${className}`}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {bookmarked ? (
        <BookmarkSolidIcon className={`text-amber-500 ${sizeClasses[size]}`} />
      ) : (
        <BookmarkOutlineIcon className={`text-gray-500 hover:text-amber-500 ${sizeClasses[size]}`} />
      )}
      
      {showText && (
        <span className={`ml-1 ${bookmarked ? 'text-amber-500' : 'text-gray-500'}`}>
          {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </span>
      )}
    </button>
  )
}
