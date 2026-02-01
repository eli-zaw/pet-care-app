import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "./database.types";

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
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
  env?: Record<string, any>;
}) => {
  // W Cloudflare runtime, zmienne są dostępne przez context.env
  // W local development, używamy import.meta.env
  // Fallback chain: context.env -> import.meta.env -> undefined
  const supabaseUrl = context.env?.SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseKey = context.env?.SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

  console.log("Creating Supabase instance with:", {
    url: supabaseUrl ? supabaseUrl.substring(0, 30) + "..." : "MISSING",
    keyPresent: !!supabaseKey,
    keyLength: supabaseKey?.length || 0,
    hasEnvContext: !!context.env,
    envKeys: context.env ? Object.keys(context.env).filter(k => k.startsWith('SUPABASE')) : [],
    importMetaEnvKeys: Object.keys(import.meta.env).filter(k => k.startsWith('SUPABASE')),
  });

  // Sprawdź czy mamy prawidłowe credentials
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials:", {
      supabaseUrlPresent: !!supabaseUrl,
      supabaseKeyPresent: !!supabaseKey,
      hasEnvContext: !!context.env,
      envKeys: context.env ? Object.keys(context.env) : [],
    });
    throw new Error(
      "Supabase credentials not configured. " +
      "For local development, add SUPABASE_URL and SUPABASE_KEY to .env file. " +
      "For Cloudflare Pages, add them in Settings -> Environment variables."
    );
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  console.log("Supabase instance created");
  return supabase;
};

// Zachowaj kompatybilność wsteczną dla istniejącego kodu
import { createClient } from "@supabase/supabase-js";
export const supabaseClient = createClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY);

export type SupabaseClient = typeof supabaseClient;
