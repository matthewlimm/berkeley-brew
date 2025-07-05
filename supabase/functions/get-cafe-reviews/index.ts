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

    // Get reviews for the cafe
    const { data: reviews, error } = await supabaseClient
      .from('reviews')
      .select(`
        id,
        content,
        golden_bear_score,
        grindability_score,
        student_friendliness_score,
        coffee_quality_score,
        vibe_score,
        created_at,
        updated_at,
        user_id,
        users:user_id (id, username, avatar_url)
      `)
      .eq('cafe_id', cafeId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch cafe reviews: ${error.message}`)
    }

    // Transform the data to include user information
    const transformedReviews = reviews.map(review => ({
      ...review,
      user: review.users || { username: 'Unknown User' }
    }))

    return new Response(
      JSON.stringify({
        status: 'success',
        results: transformedReviews.length,
        data: { reviews: transformedReviews }
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
