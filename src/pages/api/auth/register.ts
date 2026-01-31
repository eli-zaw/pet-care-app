import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { registerSchema } from "../../../lib/schemas/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Debug: sprawdź zmienne środowiskowe
    console.log("Environment check:", {
      SUPABASE_URL: !!import.meta.env.SUPABASE_URL,
      SUPABASE_KEY: !!import.meta.env.SUPABASE_KEY,
      SUPABASE_URL_VALUE: import.meta.env.SUPABASE_URL?.substring(0, 20) + "...",
      NODE_ENV: import.meta.env.MODE,
    });

    const body = await request.json();

    // Walidacja przez Zod
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: validationResult.error.errors[0].message,
        }),
        {
          status: 400,
        }
      );
    }

    const { email, password } = validationResult.data;

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    console.log("Attempting to sign up user:", { email });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/login`,
      },
    });

    console.log("SignUp result:", {
      success: !error,
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
      userConfirmed: data.user?.email_confirmed_at ? true : false,
      error: error
        ? {
            message: error.message,
            status: error.status,
          }
        : null,
    });

    if (error) {
      console.error("SignUp error details:", error);

      // Obsługa różnych błędów Supabase
      if (error.message.includes("already registered") || error.message.includes("User already registered")) {
        return new Response(
          JSON.stringify({
            error: "Ten email jest już zarejestrowany",
          }),
          {
            status: 409,
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: error.message || "Wystąpił błąd podczas rejestracji",
        }),
        {
          status: 400,
        }
      );
    }

    if (!data.user) {
      console.error("No user data returned from signUp");
      return new Response(
        JSON.stringify({
          error: "Nie udało się utworzyć konta użytkownika",
        }),
        {
          status: 500,
        }
      );
    }

    console.log("Registration successful for user:", data.user.email);

    return new Response(
      JSON.stringify({
        message: "Rejestracja zakończona sukcesem. Sprawdź swoją skrzynkę email i potwierdź konto.",
        user: {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: !!data.user.email_confirmed_at,
        },
      }),
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Register API error:", error);
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
