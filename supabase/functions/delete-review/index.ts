import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get review ID from URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const reviewId = pathParts[pathParts.length - 1]

    if (!reviewId) {
      throw new Error('Review ID is required')
    }

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

    // First check if the review exists and belongs to the user
    const { data: existingReview, error: findError } = await supabaseClient
      .from('reviews')
      .select('cafe_id')
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .single()

    if (findError || !existingReview) {
      throw new Error('Review not found or you do not have permission to delete it')
    }

    const cafeId = existingReview.cafe_id

    // Delete the review
    const { error } = await supabaseClient
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(`Failed to delete review: ${error.message}`)
    }

    // Update cafe scores
    await updateCafeScores(supabaseClient, cafeId)

    return new Response(
      JSON.stringify({
        status: 'success',
        data: { message: 'Review deleted successfully' }
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

// Helper function to update cafe scores after review changes
async function updateCafeScores(supabaseClient, cafeId) {
  try {
    // Get all reviews for the cafe
    const { data: reviews, error } = await supabaseClient
      .from('reviews')
      .select('grindability_score, student_friendliness_score, coffee_quality_score, vibe_score')
      .eq('cafe_id', cafeId)

    if (error) {
      return
    }

    // If no reviews, reset scores to null
    if (!reviews || reviews.length === 0) {
      await supabaseClient
        .from('cafes')
        .update({
          grindability_score: null,
          student_friendliness_score: null,
          coffee_quality_score: null,
          vibe_score: null,
          golden_bear_score: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', cafeId)
      return
    }

    // Calculate average scores
    const avgScores = reviews.reduce((acc, review) => {
      return {
        grindability_score: acc.grindability_score + (review.grindability_score || 0),
        student_friendliness_score: acc.student_friendliness_score + (review.student_friendliness_score || 0),
        coffee_quality_score: acc.coffee_quality_score + (review.coffee_quality_score || 0),
        vibe_score: acc.vibe_score + (review.vibe_score || 0)
      }
    }, {
      grindability_score: 0,
      student_friendliness_score: 0,
      coffee_quality_score: 0,
      vibe_score: 0
    })

    const count = reviews.length
    const avgGrindability = parseFloat((avgScores.grindability_score / count).toFixed(1))
    const avgStudentFriendliness = parseFloat((avgScores.student_friendliness_score / count).toFixed(1))
    const avgCoffeeQuality = parseFloat((avgScores.coffee_quality_score / count).toFixed(1))
    const avgVibe = parseFloat((avgScores.vibe_score / count).toFixed(1))
    const goldenBearScore = parseFloat(((avgGrindability + avgStudentFriendliness + avgCoffeeQuality + avgVibe) / 4).toFixed(1))

    // Update cafe with new average scores
    await supabaseClient
      .from('cafes')
      .update({
        grindability_score: avgGrindability,
        student_friendliness_score: avgStudentFriendliness,
        coffee_quality_score: avgCoffeeQuality,
        vibe_score: avgVibe,
        golden_bear_score: goldenBearScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', cafeId)
  } catch (err) {
    console.error('Error updating cafe scores:', err)
  }
}
