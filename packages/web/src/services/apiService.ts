import { supabase } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

// Helper function to get auth headers
async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    console.log('Getting auth header...');
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

// Helper function to normalize URL and prevent double slashes
function normalizeUrl(baseUrl: string, path: string, endpoint: string): string {
  // Ensure endpoint has a leading slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Combine and normalize to prevent double slashes
  return `${baseUrl}${path}${normalizedEndpoint}`.replace(/([^:]\/)\/+/g, '$1');
}

class ApiService {
  async get<T = any>(endpoint: string): Promise<{ data: T }> {
    const headers = await getAuthHeader();
    const url = normalizeUrl(API_URL, '/api', endpoint);
    console.log('Making GET request to:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  async post<T = any>(endpoint: string, data: any): Promise<{ data: T }> {
    const headers = await getAuthHeader();
    const url = normalizeUrl(API_URL, '/api', endpoint);
    console.log('Making POST request to:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  async delete<T = any>(endpoint: string): Promise<{ data: T }> {
    const headers = await getAuthHeader();
    const url = normalizeUrl(API_URL, '/api', endpoint);
    console.log('Making DELETE request to:', url);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  async put<T = any>(endpoint: string, data: any): Promise<{ data: T }> {
    const headers = await getAuthHeader();
    const url = normalizeUrl(API_URL, '/api', endpoint);
    console.log('Making PUT request to:', url);
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return response.json();
  }
}

export const apiService = new ApiService();
