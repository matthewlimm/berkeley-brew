import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic since it handles authentication callbacks
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Use nextUrl property which is designed for Next.js route handlers
  const code = request.nextUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after sign in
  // Use absolute URL for redirect to avoid using request.url
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return NextResponse.redirect(new URL('/dashboard', baseUrl));
}
