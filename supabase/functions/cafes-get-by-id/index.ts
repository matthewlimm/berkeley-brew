import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get cafe ID from URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const cafeId = pathParts[pathParts.length - 1]

    if (!cafeId) {
      throw new Error('Cafe ID is required')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get cafe with reviews
    const { data: cafe, error } = await supabaseClient
      .from('cafes')
      .select(`
        id,
        name,
        address,
        created_at,
        updated_at,
        image_url,
        grindability_score,
        student_friendliness_score,
        place_id,
        business_hours,
        coffee_quality_score,
        vibe_score,
        golden_bear_score,
        popular_times,
        popular_times_updated_at,
        price_category,
        location,
        reviews (
          id,
          content,
          golden_bear_score,
          grindability_score,
          student_friendliness_score,
          coffee_quality_score,
          vibe_score,
          created_at,
          updated_at,
          user_id
        )
      `)
      .eq('id', cafeId)
      .single()

    if (error) throw error
    if (!cafe) throw new Error('Cafe not found')

    // If there are reviews, fetch the user information for each review
    if (cafe.reviews && cafe.reviews.length > 0) {
      // Get all unique user IDs from the reviews
      const userIds = cafe.reviews
        .map(review => review.user_id)
        .filter((id) => id !== null && id !== undefined)

      // Fetch user information for these IDs
      const { data: users, error: userError } = await supabaseClient
        .from('users')
        .select('id, username')
        .in('id', userIds)

      if (!userError && users) {
        // Create a map of user_id to user data for quick lookup
        const userMap = users.reduce((map, user) => {
          if (user && user.id) {
            map[user.id] = user
          }
          return map
        }, {})

        // Add user data to each review
        cafe.reviews = cafe.reviews.map((review) => ({
          ...review,
          updated_at: review.updated_at ?? null,
          created_at: review.created_at ?? null,
          user: review.user_id && userMap[review.user_id]
            ? userMap[review.user_id]
            : { username: 'Unknown User' }
        }))
      }
    }

    // Calculate average rating
    const reviews = cafe.reviews || []
    const ratings = reviews.map(review => review.golden_bear_score)
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : 0

    // Add placeholder for realtime data
    const realtimeData = {
      wifi_availability: null,
      outlet_availability: null,
      seating: null
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        data: {
          cafe: {
            ...cafe,
            realtime: [realtimeData],
            average_rating: avgRating,
            review_count: reviews.length
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
