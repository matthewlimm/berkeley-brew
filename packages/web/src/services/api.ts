import type { Database } from '@berkeley-brew/api/src/db'

type Cafe = Database['public']['Tables']['cafes']['Row']
type Review = Database['public']['Tables']['reviews']['Row']

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiResponse<T> {
  status: 'success' | 'fail' | 'error'
  data?: T
  message?: string
}

export async function getCafes(): Promise<ApiResponse<{ cafes: (Cafe & { average_rating: number | null })[] }>> {
  const res = await fetch(`${API_URL}/api/cafes`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to fetch cafes')
  }
  return res.json()
}

export async function getCafe(id: string): Promise<ApiResponse<{ cafe: Cafe & { reviews: Review[] } }>> {
  const res = await fetch(`${API_URL}/api/cafes/${id}`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to fetch cafe')
  }
  return res.json()
}

export async function createReview(cafeId: string, data: { content: string; rating: number }): Promise<ApiResponse<void>> {
  const res = await fetch(`${API_URL}/api/cafes/${cafeId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Failed to create review')
  }
  return res.json()
}
