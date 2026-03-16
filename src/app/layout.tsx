import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if the 'next' parameter is not present, redirect to the dashboard
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // router errors can occur if the cookie string is malformed or if there are issues with the cookie store
              console.error("Cookie setting error:", error);
            }
          },
        },
      }
    );
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // if auth is successful, redirect to the next page (default is dashboard)
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Auth Exchange Error:", error.message);
    }
  }

  // if code is missing or auth fails, redirect to home or an error page
  return NextResponse.redirect(`${origin}/`);
}