import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return new Response(JSON.stringify({
        error: "Wystąpił błąd podczas wylogowywania"
      }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({
      message: "Wylogowanie zakończone sukcesem"
    }), {
      status: 200,
    });
  } catch (error) {
    console.error('Logout API error:', error);
    return new Response(JSON.stringify({
      error: "Wystąpił błąd serwera"
    }), {
      status: 500,
    });
  }
};