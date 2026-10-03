import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function readSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    typeof url !== "string" ||
    !/^https?:\/\//.test(url) ||
    url === "your_supabase_url" ||
    typeof anonKey !== "string" ||
    anonKey.length === 0 ||
    anonKey === "your_supabase_anon_key"
  ) {
    return null;
  }

  return { url, anonKey };
}

const supabaseConfig = readSupabaseConfig();

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!supabaseConfig) return response;

  const supabase = createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};
