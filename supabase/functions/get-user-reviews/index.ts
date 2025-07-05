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

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Authentication required')
    }

    // Get user reviews from database
    const { data, error } = await supabaseClient
      .from('reviews')
      .select(`
        *,
        cafes:cafe_id (id, name, address)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch user reviews: ${error.message}`)
    }

    // Transform the data to match the expected format
    const transformedReviews = data.map(review => ({
      ...review,
      cafe_name: review.cafes?.name || 'Unknown Cafe',
      // Use existing score fields or default to null
      golden_bear_score: review.golden_bear_score,
      grindability_score: review.grindability_score,
      student_friendliness_score: review.student_friendliness_score,
      coffee_quality_score: review.coffee_quality_score,
      vibe_score: review.vibe_score
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
