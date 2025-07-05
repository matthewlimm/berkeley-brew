import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
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

    // Parse request body
    const requestData = await req.json()
    
    // Extract fields from request body, handling both name and full_name
    let { username, full_name, avatar_url, name } = requestData

    // If name is provided but full_name is not, use name for full_name
    if (name && !full_name) {
      full_name = name
    }

    if (!username && !full_name && !avatar_url) {
      throw new Error('No update data provided')
    }

    // First, try to directly update the user record
    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    }

    if (username) updateData.username = username
    if (full_name) updateData.full_name = full_name
    if (avatar_url) updateData.avatar_url = avatar_url

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    let updatedUser

    if (checkError || !existingUser) {
      // User doesn't exist, we need to create them
      // Prepare insert data
      const insertData = {
        id: user.id,
        username: username || user.email?.split('@')[0] || null,
        full_name: full_name || null,
        avatar_url: avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Try to upsert the user
      const { data: newUser, error: upsertError } = await supabaseClient
        .from('users')
        .upsert(insertData)
        .select()
        .single()

      if (upsertError) {
        throw new Error(`Failed to create or update user profile: ${upsertError.message}`)
      }

      updatedUser = newUser
    } else {
      // User exists, update the record
      // Try upsert as a more reliable approach
      const upsertData = {
        id: user.id,
        username: username || existingUser.username,
        full_name: full_name || existingUser.full_name,
        avatar_url: avatar_url || existingUser.avatar_url,
        updated_at: new Date().toISOString()
      }

      const { data: upsertedUser, error: upsertError } = await supabaseClient
        .from('users')
        .upsert(upsertData)
        .select()
        .single()

      if (upsertError) {
        throw new Error(`Failed to update user profile: ${upsertError.message}`)
      }

      updatedUser = upsertedUser
    }

    // Also update user metadata in auth if possible
    try {
      await supabaseClient.auth.updateUser({
        data: {
          username: username || user.user_metadata?.username,
          name: full_name || user.user_metadata?.name,
          avatar_url: avatar_url || user.user_metadata?.avatar_url
        }
      })
    } catch (authUpdateError) {
      // Continue anyway since the database was updated successfully
      console.error('Failed to update auth metadata:', authUpdateError)
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        data: { user: updatedUser }
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
