'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { apiService } from '@/services/apiService'

interface BookmarkContextType {
  bookmarkedCafes: string[]
  isBookmarked: (cafeId: string) => boolean
  addBookmark: (cafeId: string) => Promise<void>
  removeBookmark: (cafeId: string) => Promise<void>
  refreshBookmarks: () => Promise<void>
  isLoading: boolean
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined)

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarkedCafes, setBookmarkedCafes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user, session } = useAuth()

  // Fetch all bookmarks when user or session changes
  useEffect(() => {
    if (user && session) {
      refreshBookmarks()
    } else {
      // Clear bookmarks when user logs out
      setBookmarkedCafes([])
    }
  }, [user, session])

  // Function to refresh all bookmarks
  const refreshBookmarks = async () => {
    if (!user || !session) {
      setBookmarkedCafes([])
      return
    }

    try {
      setIsLoading(true)
      const response = await apiService.get('/bookmarks')
      console.log('All bookmarks response:', response)
      
      // The response is directly the array of bookmarks
      if (response && Array.isArray(response)) {
        const cafeIds = response.map((bookmark: any) => bookmark.cafe_id)
        console.log('Extracted cafe IDs:', cafeIds)
        setBookmarkedCafes(cafeIds)
      } 
      // Or it might be wrapped in a data property
      else if (response && response.data && Array.isArray(response.data)) {
        const cafeIds = response.data.map((bookmark: any) => bookmark.cafe_id)
        console.log('Extracted cafe IDs from response.data:', cafeIds)
        setBookmarkedCafes(cafeIds)
      } 
      // If we can't find the data, log a warning and set empty array
      else {
        console.warn('Could not extract bookmarks from response:', response)
        setBookmarkedCafes([])
      }
    } catch (err) {
      console.error('Error fetching bookmarks:', err)
      setBookmarkedCafes([])
    } finally {
      setIsLoading(false)
    }
  }

  // Check if a cafe is bookmarked
  const isBookmarked = (cafeId: string) => {
    return bookmarkedCafes.includes(cafeId)
  }

  // Add a bookmark
  const addBookmark = async (cafeId: string) => {
    if (!user) return

    try {
      setIsLoading(true)
      const response = await apiService.post('/bookmarks', { cafe_id: cafeId })
      console.log('Bookmark add response:', response.data)
      
      // Update local state
      setBookmarkedCafes(prev => [...prev, cafeId])
    } catch (err) {
      console.error('Error adding bookmark:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Remove a bookmark
  const removeBookmark = async (cafeId: string) => {
    if (!user) return

    try {
      setIsLoading(true)
      const response = await apiService.delete(`/bookmarks/${cafeId}`)
      console.log('Bookmark delete response:', response.data)
      
      // Update local state
      setBookmarkedCafes(prev => prev.filter(id => id !== cafeId))
    } catch (err) {
      console.error('Error removing bookmark:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <BookmarkContext.Provider
      value={{
        bookmarkedCafes,
        isBookmarked,
        addBookmark,
        removeBookmark,
        refreshBookmarks,
        isLoading
      }}
    >
      {children}
    </BookmarkContext.Provider>
  )
}

export function useBookmarks() {
  const context = useContext(BookmarkContext)
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider')
  }
  return context
}
