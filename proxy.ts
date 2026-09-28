import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Auth pages: logged-out only. Logged-in users get sent to their home screen.
const AUTH_PATHS = ["/login", "/signup"];

function homeFor(gender: string | undefined) {
  return gender === "male" ? "/requests" : "/explore";
}

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

  if (!user && !isAuthPage && !isLanding) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("gender, is_complete")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.is_complete) {
      if (path !== "/profile-setup") {
        return NextResponse.redirect(new URL("/profile-setup", request.url));
      }
      return response;
    }

    if (isAuthPage || isLanding) {
      return NextResponse.redirect(new URL(homeFor(profile.gender), request.url));
    }

    if (path.startsWith("/explore") && profile.gender !== "female") {
      return NextResponse.redirect(new URL("/requests", request.url));
    }
    if (path.startsWith("/requests") && profile.gender !== "male") {
      return NextResponse.redirect(new URL("/explore", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
