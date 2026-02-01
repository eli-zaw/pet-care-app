import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, cookies, url, request, redirect } = context;

  try {
    const { createSupabaseServerInstance } = await import("../db/supabase.client");

    // Get required environment variables from Cloudflare runtime.
    // We intentionally project to string values only (Record<string, string|undefined>)
    // because Cloudflare env bindings can include non-string bindings (KV, D1, etc).
    const runtimeEnv = locals.runtime?.env;
    const env: Record<string, string | undefined> = {
      SUPABASE_URL: runtimeEnv?.SUPABASE_URL,
      SUPABASE_KEY: runtimeEnv?.SUPABASE_KEY,
      DEBUG_ERRORS: runtimeEnv?.DEBUG_ERRORS,
    };
    locals.env = env;

    // Initial Supabase client – used only for auth verification.
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
      env,
    });

    locals.supabase = supabase;

    // Only call Supabase auth when we actually have auth cookies.
    // This prevents AuthSessionMissingError noise for anonymous visitors.
    const cookieHeader = request.headers.get("Cookie") ?? "";
    const hasSupabaseAuthCookie = cookieHeader
      .split(";")
      .map((c) => c.trim().split("=")[0])
      .some((name) => name.startsWith("sb-") && (name.endsWith("-auth-token") || name.includes("-auth-token.")));

    let user: { id: string; email: string | undefined } | null = null;
    if (hasSupabaseAuthCookie) {
      // getUser() validates the session with the auth server (recommended
      // over getSession() which only reads cookies and can be tampered with).
      const {
        data: { user: supabaseUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error getting user:", userError);
      }

      if (supabaseUser) {
        user = { id: supabaseUser.id, email: supabaseUser.email };

        // Obtain the (potentially refreshed) access token so PostgREST
        // queries carry auth.uid() for RLS.
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          // Create a second client whose custom fetch wrapper guarantees
          // the JWT is sent on every data request.  We need this because
          // @supabase/ssr's internal onAuthStateChange listener overwrites
          // global.headers.Authorization, making the global-headers approach
          // unreliable in SSR.
          locals.supabase = createSupabaseServerInstance({
            cookies,
            headers: request.headers,
            env,
            accessToken: session.access_token,
          });
        }
      }
    }

    locals.user = user ? { email: user.email, id: user.id } : null;

    // Sprawdź czy trasa wymaga ochrony
    const isProtectedRoute = url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/pets");

    // Sprawdź czy to trasa tylko dla niezalogowanych
    const isAuthOnlyRoute = url.pathname === "/login" || url.pathname === "/register";

    // Jeśli chroniona trasa i użytkownik niezalogowany → przekieruj do logowania
    if (isProtectedRoute && !user) {
      return redirect(`/login?redirect=${encodeURIComponent(url.pathname)}`);
    }

    // Jeśli trasa tylko dla niezalogowanych i użytkownik zalogowany → przekieruj do dashboardu
    if (isAuthOnlyRoute && user) {
      return redirect("/dashboard");
    }

    return next();
  } catch (error) {
    console.error("Middleware error:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }

    // W przypadku błędu, ustaw domyślne wartości i pozwól kontynuować
    locals.supabase = null;
    locals.user = null;
    return next();
  }
});
