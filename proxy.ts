import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Auth pages: logged-out only. Logged-in users get sent to their home screen.
const AUTH_PATHS = ["/login", "/signup"];

const HOME = "/explore";
const VERIFY = "/verify";
const SETUP = "/profile-setup";

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
  const isAuthPage = AUTH_PATHS.some((p) => path.startsWith(p));
  const isLanding = path === "/";

  // API routes do their own auth checks and must never get an HTML redirect.
  if (path.startsWith("/api/")) return response;

  if (!user && !isAuthPage && !isLanding) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const [{ data: verification }, { data: profile }] = await Promise.all([
      supabase.from("verifications").select("status").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("is_complete").eq("user_id", user.id).maybeSingle(),
    ]);

    // Step 1: prove you're a student (college email or admission letter).
    if (verification?.status !== "verified") {
      return path === VERIFY ? response : NextResponse.redirect(new URL(VERIFY, request.url));
    }

    // Step 2: finish your profile + quiz.
    if (!profile?.is_complete) {
      return path === SETUP ? response : NextResponse.redirect(new URL(SETUP, request.url));
    }

    if (isAuthPage || isLanding || path === VERIFY || path === SETUP) {
      return NextResponse.redirect(new URL(HOME, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
