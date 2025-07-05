import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.21.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Validation schema for reviews
const reviewSchema = z.object({
  content: z.string().min(0),
  grindability_score: z.number().min(0).max(5),
  student_friendliness_score: z.number().min(0).max(5),
  coffee_quality_score: z.number().min(0).max(5),
  vibe_score: z.number().min(0).max(5)
})

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get cafe ID from URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const cafeId = pathParts[pathParts.length - 2] // Assuming URL pattern /add-cafe-review/:id

    if (!cafeId) {
      throw new Error('Cafe ID is required')
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

    // Parse request body
    const requestData = await req.json()
    
    // Validate request body
    const validation = reviewSchema.safeParse(requestData)
    if (!validation.success) {
      throw new Error(`Invalid review data: ${validation.error.message}`)
    }

    const { content, grindability_score, student_friendliness_score, coffee_quality_score, vibe_score } = validation.data

    // Check if cafe exists
    const { data: cafe, error: cafeError } = await supabaseClient
      .from('cafes')
      .select('id')
      .eq('id', cafeId)
      .single()

    if (cafeError || !cafe) {
      throw new Error('Cafe not found')
    }

    // Check if user has already reviewed this cafe
    const { data: existingReview, error: reviewCheckError } = await supabaseClient
      .from('reviews')
      .select()
      .eq('cafe_id', cafeId)
      .eq('user_id', user.id)
      .single()

    if (existingReview) {
      throw new Error('You have already reviewed this cafe')
    }

    // First, ensure the user exists in the public.users table
    const { data: existingUser, error: userCheckError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    // If user doesn't exist in public schema, create them
    if (!existingUser) {
      // Get name from user metadata if available
      const fullName = user.user_metadata?.name || user.user_metadata?.full_name || ''
      
      const { error: createUserError } = await supabaseClient
        .from('users')
        .insert({
          id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          full_name: fullName,
          updated_at: new Date().toISOString()
        })

      if (createUserError) {
        throw new Error(`Failed to create user profile: ${createUserError.message}`)
      }
    }

    // Add the review
    const { error } = await supabaseClient
      .from('reviews')
      .insert({
        cafe_id: cafeId,
        user_id: user.id,
        content,
        grindability_score,
        student_friendliness_score,
        coffee_quality_score,
        vibe_score,
        golden_bear_score: (grindability_score + student_friendliness_score + coffee_quality_score + vibe_score) / 4
      })

    if (error) {
      throw new Error(`Failed to create review: ${error.message}`)
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        data: { message: 'Review submitted successfully' }
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
