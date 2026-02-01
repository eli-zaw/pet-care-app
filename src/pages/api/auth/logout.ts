import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const { cookies, request } = context;
    // @ts-ignore - Cloudflare runtime
    const env = context.locals.runtime?.env || {};
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
      env,
    });

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return new Response(
        JSON.stringify({
          error: "Wystąpił błąd podczas wylogowywania",
        }),
        {
          status: 500,
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Wylogowanie zakończone sukcesem",
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Logout API error:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd serwera",
      }),
      {
        status: 500,
      }
    );
  }
};
