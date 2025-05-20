import type { Database } from '@berkeley-brew/api/src/db'
import { supabase } from '@/lib/supabase'
import { UUID } from 'crypto'

type Cafe = Database['public']['Tables']['cafes']['Row']
type Review = Database['public']['Tables']['reviews']['Row']

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Helper function to get auth headers
async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()

  // Debug authentication
  console.log('Auth session exists:', !!data.session)
  console.log('Auth token exists:', !!data.session?.access_token)

  return data.session?.access_token ? {
    'Authorization': `Bearer ${data.session.access_token}`
  } : {}
}

interface ApiResponse<T> {
  status: 'success' | 'fail' | 'error'
  data?: T
  message?: string
}

export async function getCafes(): Promise<ApiResponse<{ cafes: (Cafe & { average_rating: number | null })[] }>> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/api/cafes`, { headers })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to fetch cafes')
  }
  return res.json()
}

export async function getCafe(id: string): Promise<ApiResponse<{ cafe: Cafe & { reviews: Review[] } }>> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/api/cafes/${id}`, { headers })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to fetch cafe')
  }
  return res.json()
}

export async function createReview(cafeId: string, data: { content: string; rating: number }): Promise<ApiResponse<void>> {
  const authHeaders = await getAuthHeader()

  // Debug request headers
  console.log('Review submission headers:', {
    'Content-Type': 'application/json',
    ...authHeaders
  })

  const res = await fetch(`${API_URL}/api/cafes/${cafeId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
    body: JSON.stringify(data),
    // Add credentials to include cookies
    credentials: 'include'
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to create review')
  }
  return res.json()
}

export async function createPost(id: string, data: { title: string, content: string, type: string, brew_method: string, difficulty_level: number, prep_time: number, ingredients: string[] }): Promise<ApiResponse<void>> {
  const res = await fetch(`${API_URL}/api/posts/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to create a post')
  }
  return res.json()
}

export async function getPosts(): Promise<ApiResponse<{ posts: any[] }>> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/api/posts`, { headers })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to get posts')
  }
  return res.json()
}

export async function getUserReviews(): Promise<ApiResponse<{ reviews: (Review & { cafe_name: string })[] }>> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/api/user/reviews`, { headers })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to fetch user reviews')
  }
  return res.json()
}

export async function updateUserProfile(data: { username?: string; full_name?: string; name?: string; avatar_url?: string }): Promise<ApiResponse<{ user: any }>> {
  const headers = await getAuthHeader()
  
  // Make sure we have the correct field names for the backend
  const apiData = {
    username: data.username,
    full_name: data.full_name || data.name, // Use name as fallback for full_name
    avatar_url: data.avatar_url
  }
  
  // Debug request data and headers
  console.log('Profile update request data (original):', data)
  console.log('Profile update request data (modified for API):', apiData)
  console.log('Profile update headers:', {
    'Content-Type': 'application/json',
    ...headers
  })
  
  try {
    const res = await fetch(`${API_URL}/api/user/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(apiData),
      credentials: 'include'
    })
    
    console.log('Profile update response status:', res.status)
    
    if (!res.ok) {
      const errorData = await res.json()
      console.error('Profile update error response:', errorData)
      throw new Error(errorData.message || `Failed to update user profile: ${res.status}`)
    }
    
    const responseData = await res.json()
    console.log('Profile update success response:', responseData)
    return responseData
  } catch (error) {
    console.error('Profile update fetch error:', error)
    throw error
  }
}
