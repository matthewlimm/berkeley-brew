import type { Database } from '@berkeley-brew/api/src/db'
import { supabase } from '@/lib/supabase'
import { UUID } from 'crypto'

type Cafe = Database['public']['Tables']['cafes']['Row']
type Review = Database['public']['Tables']['reviews']['Row']

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

// Helper function to get auth headers
async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    console.log('Getting auth header...');
    // Use the imported supabase client instead of dynamic import
    const session = await supabase.auth.getSession();
    console.log('Session data available:', !!session?.data);
    
    const token = session?.data?.session?.access_token;
    console.log('Token available:', !!token);
    
    if (!token) {
      console.warn('No authentication token found!');
      return {};
    }
    
    console.log('Auth token (first 10 chars):', token.substring(0, 10) + '...');
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
    console.log('Fetching user reviews...');
    const headers = await getAuthHeader();
    console.log('Auth headers:', headers);
    console.log('API URL:', `${API_URL}/api/user/reviews`);
    
    const res = await fetch(`${API_URL}/api/user/reviews`, { headers });
    console.log('Response status:', res.status);
    
    if (!res.ok) {
      const error = await res.json();
      console.error('Error response:', error);
      throw new Error(error.message || 'Failed to fetch user reviews');
    }
    
    const data = await res.json();
    console.log('User reviews data:', data);
    return data;
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
    console.log('Updating review:', reviewId, data);
    const headers = await getAuthHeader();
    console.log('Auth headers:', headers);
    
    // The correct endpoint URL based on the backend routes
    const url = `${API_URL}/api/cafes/reviews/${reviewId}`;
    console.log('Update review URL:', url);
    
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data)
    });
    
    console.log('Update review response status:', res.status);
    
    if (!res.ok) {
      const error = await res.json();
      console.error('Error updating review:', error);
      throw new Error(error.message || 'Failed to update review');
    }
    
    const result = await res.json();
    console.log('Update review result:', result);
    return result;
  } catch (error) {
    console.error('Error in updateReview:', error);
    throw error;
  }
}

export async function deleteReview(reviewId: string): Promise<ApiResponse<null>> {
  try {
    console.log('Deleting review:', reviewId);
    const headers = await getAuthHeader();
    console.log('Auth headers:', headers);
    
    // The correct endpoint URL based on the backend routes
    const url = `${API_URL}/api/cafes/reviews/${reviewId}`;
    console.log('Delete review URL:', url);
    
    const res = await fetch(url, {
      method: 'DELETE',
      headers
    });
    
    console.log('Delete review response status:', res.status);
    
    if (!res.ok) {
      const error = await res.json();
      console.error('Error deleting review:', error);
      throw new Error(error.message || 'Failed to delete review');
    }
    
    const result = await res.json();
    console.log('Delete review result:', result);
    return result;
  } catch (error) {
    console.error('Error in deleteReview:', error);
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
