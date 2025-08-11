import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic since it uses search parameters
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/auth/login?error=callback_error', origin));
    }
    
    // If we have a user and session, ensure their profile exists in the database
    if (data.user && data.session) {
      try {
        console.log('User confirmed email, ensuring profile exists:', data.user.id);
        console.log('User metadata:', data.user.user_metadata);
        
        // Get the API URL from environment
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        
        // Call our API to ensure the user profile exists
        const response = await fetch(`${apiUrl}/api/user/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session.access_token}`
          },
          body: JSON.stringify({
            full_name: data.user.user_metadata?.name || null,
            username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || null
          })
        });
        
        if (response.ok) {
          const profileData = await response.json();
          console.log('User profile ensured in database:', profileData);
        } else {
          console.warn('Failed to ensure user profile in database:', await response.text());
        }
      } catch (profileError) {
        console.warn('Error ensuring user profile in database:', profileError);
        // Don't fail the callback - user can still access the app
      }
    }
  }

  // URL to redirect to after sign in with verification success parameter
  return NextResponse.redirect(new URL('/dashboard?verified=true', origin));
}
