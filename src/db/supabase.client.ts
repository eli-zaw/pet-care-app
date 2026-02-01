import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "./database.types";

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  // local dev often runs on http; secure cookies won't be set/sent there.
  secure: import.meta.env.PROD,
  httpOnly: true,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
  env?: Record<string, string | undefined>;
  accessToken?: string;
}) => {
  // W Cloudflare runtime, zmienne są dostępne przez context.env
  // W local development, używamy import.meta.env
  // Fallback chain: context.env -> import.meta.env -> undefined
  const supabaseUrl = context.env?.SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseKey = context.env?.SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase credentials not configured. " +
        "For local development, add SUPABASE_URL and SUPABASE_KEY to .env file. " +
        "For Cloudflare Pages, add them in Settings -> Environment variables."
    );
  }

  // When an access token is provided, wrap fetch so every PostgREST /
  // storage / functions request carries the user's JWT.  The internal
  // onAuthStateChange listener in @supabase/supabase-js always overwrites
  // global.headers.Authorization, so setting it via `global.headers` alone
  // is not reliable in SSR.  A custom fetch runs *after* all header merging
  // and therefore cannot be overridden by the auth module.
  const customFetch = context.accessToken
    ? (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        const url = input instanceof Request ? input.url : input.toString();
        // Leave auth endpoints alone – they use apikey / own tokens.
        if (!url.includes("/auth/v1/")) {
          headers.set("Authorization", `Bearer ${context.accessToken}`);
          console.log("customFetch: Setting Authorization header for", url, {
            hasAuthHeader: headers.has("Authorization"),
            tokenLength: context.accessToken?.length,
          });
        }
        return fetch(input, { ...init, headers });
      }
    : undefined;

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookieOptions,
    global: customFetch ? { fetch: customFetch } : undefined,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

// Export type for Supabase client
import type { SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";
export type SupabaseClient = SupabaseClientType<Database, "public", Database["public"]>;
