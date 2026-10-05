import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];
const TWO_FACTOR_PATH = "/verify-2fa";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

  // 2FA gate: a signed-in user whose profile requires 2FA must have a session
  // that has already passed check_2fa.
  if (user && isProtected && !request.nextUrl.pathname.startsWith(TWO_FACTOR_PATH)) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("mfa_method")
        .eq("id", user.id)
        .maybeSingle();

      const method = (profile as { mfa_method?: string | null } | null)?.mfa_method;

      if (method && method !== "none") {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const { data: verified, error: rpcError } = await supabase.rpc(
            "check_2fa",
            { p_session_id: session.access_token },
          );

          if (!rpcError && verified === false) {
            const url = request.nextUrl.clone();
            url.pathname = TWO_FACTOR_PATH;
            url.searchParams.set("next", request.nextUrl.pathname);
            return NextResponse.redirect(url);
          }
        }
      }
    } catch {
      /* fail open — never lock a user out because the check errored */
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};
