import type { Database } from '../../../api/src/types/database.types'
import { supabase } from '@/lib/supabase'
import { UUID } from 'crypto'

type Cafe = Database['public']['Tables']['cafes']['Row']
type Review = Database['public']['Tables']['reviews']['Row']

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Helper function to get auth headers
async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;
    
    if (!token) {
      return {};
    }
    
    return {
      'Authorization': `Bearer ${token}`
    };
  } catch (error) {
    console.error('Error getting auth header:', error);
    return {};
  }
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

export async function createReview(cafeId: string, data: { 
  content: string; 
  grindability_score: number; 
  student_friendliness_score: number; 
  coffee_quality_score: number; 
  vibe_score: number; 
}): Promise<ApiResponse<{ review: any }>> {
  // Calculate golden_bear_score as the average of all subscores
  const reviewData = {
    ...data,
    golden_bear_score: (
      data.grindability_score + 
      data.student_friendliness_score + 
      data.coffee_quality_score + 
      data.vibe_score
    ) / 4
  };
  const authHeaders = await getAuthHeader()
  
  const res = await fetch(`${API_URL}/api/cafes/${cafeId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
    body: JSON.stringify(reviewData),
    // Add credentials to include cookies
    credentials: 'include'
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to create review')
  }
  return res.json()
}

export async function getUserReviews(): Promise<ApiResponse<{ reviews: (Review & { cafe_name: string })[] }>> {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}/api/user/reviews`, { headers });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch user reviews');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error in getUserReviews:', error);
    throw error;
  }
}

export async function updateReview(reviewId: string, data: {
  content: string;
  // golden_bear_score is now calculated on the backend
  grindability_score: number;
  student_friendliness_score: number;
  coffee_quality_score: number;
  vibe_score: number;
}): Promise<ApiResponse<{ review: any }>> {
  try {
    const headers = await getAuthHeader();
    const url = `${API_URL}/api/cafes/reviews/${reviewId}`;
    
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data)
    });
    
    if (!res.ok) {
      const error = await res.json();
      console.error('Error updating review:', error);
      throw new Error(error.message || 'Failed to update review');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error in updateReview:', error);
    throw error;
  }
}

export async function deleteReview(reviewId: string): Promise<ApiResponse<null>> {
  try {
    const headers = await getAuthHeader();
    const url = `${API_URL}/api/cafes/reviews/${reviewId}`;
    
    const res = await fetch(url, {
      method: 'DELETE',
      headers
    });
    
    if (!res.ok) {
      const error = await res.json();
      console.error('Error deleting review:', error);
      throw new Error(error.message || 'Failed to delete review');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error in deleteReview:', error);
    throw error;
  }
}

export async function getUserProfile(): Promise<ApiResponse<{ user: any }>> {
  try {
    const headers = await getAuthHeader();
    
    const res = await fetch(`${API_URL}/api/user/profile`, { 
      headers,
      credentials: 'include'
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to fetch user profile');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    throw error;
  }
}

export async function updateUserProfile(data: { username?: string; full_name?: string; name?: string; avatar_url?: string }): Promise<ApiResponse<{ user: any }>> {
  const headers = await getAuthHeader()
  
  // Make sure we have the correct field names for the backend
  const apiData = {
    username: data.username,
    full_name: data.full_name || data.name, // Use name as fallback for full_name
    avatar_url: data.avatar_url
  }
  
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
    
    if (!res.ok) {
      let errorMessage = `Failed to update user profile: ${res.status}`
      
      try {
        const errorData = await res.json()
        console.error('Profile update error response:', errorData)
        errorMessage = errorData.message || errorMessage
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError)
      }
      
      const error = new Error(errorMessage)
      // Preserve the status code for specific error handling
      ;(error as any).status = res.status
      throw error
    }
    
    return res.json()
  } catch (error) {
    console.error('Profile update fetch error:', error)
    throw error
  }
}
