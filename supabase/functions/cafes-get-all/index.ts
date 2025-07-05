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
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get cafes with their reviews
    const { data: cafes, error } = await supabaseClient
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
        coffee_quality_score, 
        vibe_score,
        golden_bear_score,
        latitude,
        longitude,
        popular_times,
        popular_times_updated_at,
        place_id,
        business_hours,
        price_category,
        location,
        reviews (
          grindability_score,
          student_friendliness_score,
          coffee_quality_score,
          vibe_score,
          golden_bear_score
        )
      `)
      .order('name')

    if (error) throw error

    // Calculate average rating for each cafe
    const cafesWithAvgRating = cafes.map(cafe => {
      const reviews = (cafe.reviews || []).filter(r => r && r.golden_bear_score !== undefined)
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + Number(r.golden_bear_score), 0) / reviews.length
        : null
      
      return {
        ...cafe,
        average_rating: avgRating,
        review_count: reviews.length
      }
    })

    return new Response(
      JSON.stringify({
        status: 'success',
        data: { cafes: cafesWithAvgRating }
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
