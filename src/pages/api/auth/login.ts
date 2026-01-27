import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';
import { loginSchema } from '../../../lib/schemas/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    // Walidacja przez Zod
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(JSON.stringify({
        error: validationResult.error.errors[0].message
      }), {
        status: 400,
      });
    }

    const { email, password } = validationResult.data;

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Nie ujawniaj czy email istnieje - zawsze ten sam komunikat
      return new Response(JSON.stringify({
        error: "Nieprawidłowy email lub hasło"
      }), {
        status: 401,
      });
    }

    return new Response(JSON.stringify({
      message: "Logowanie zakończone sukcesem",
      user: {
        id: data.user.id,
        email: data.user.email,
      }
    }), {
      status: 200,
    });
  } catch (error) {
    console.error('Login API error:', error);
    return new Response(JSON.stringify({
      error: "Wystąpił błąd serwera"
    }), {
      status: 500,
    });
  }
};