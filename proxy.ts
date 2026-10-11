import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { redirectFor } from "@/lib/routing";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  // API routes do their own auth checks and must never get an HTML redirect.
  if (path.startsWith("/api/")) return response;

  let status = null;
  let profileComplete = false;
  if (user) {
    const [{ data: verification }, { data: profile }] = await Promise.all([
      supabase.from("verifications").select("status").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("is_complete").eq("user_id", user.id).maybeSingle(),
    ]);
    status = verification?.status ?? null;
    profileComplete = !!profile?.is_complete;
  }

  const target = redirectFor({ path, loggedIn: !!user, status, profileComplete });
  if (target) return NextResponse.redirect(new URL(target, request.url));

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
