import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.21.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
}

// Validation schema for reviews
const reviewSchema = z.object({
  content: z.string().min(0).max(1000),
  grindability_score: z.number().min(1).max(5),
  student_friendliness_score: z.number().min(1).max(5),
  coffee_quality_score: z.number().min(1).max(5),
  vibe_score: z.number().min(1).max(5)
})

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
      .select('*')
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .single()

    if (findError || !existingReview) {
      throw new Error('Review not found or you do not have permission to update it')
    }

    // Parse request body
    const requestData = await req.json()
    
    // Validate request body
    const validation = reviewSchema.safeParse(requestData)
    if (!validation.success) {
      throw new Error(`Invalid review data: ${validation.error.message}`)
    }

    const { content, grindability_score, student_friendliness_score, coffee_quality_score, vibe_score } = validation.data

    // Calculate golden_bear_score as the average of the 4 subscores
    const golden_bear_score = (grindability_score + student_friendliness_score + coffee_quality_score + vibe_score) / 4

    // Update the review
    const { error } = await supabaseClient
      .from('reviews')
      .update({
        content,
        grindability_score,
        student_friendliness_score,
        coffee_quality_score,
        vibe_score,
        golden_bear_score: parseFloat(golden_bear_score.toFixed(1)),
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(`Failed to update review: ${error.message}`)
    }

    // Update cafe scores
    await updateCafeScores(supabaseClient, existingReview.cafe_id)

    return new Response(
      JSON.stringify({
        status: 'success',
        data: { message: 'Review updated successfully' }
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

    if (error || !reviews || reviews.length === 0) {
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
