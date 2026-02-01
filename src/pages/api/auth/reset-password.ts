import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { resetPasswordSchema } from "../../../lib/schemas/auth";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const { request, cookies } = context;
    const body = await request.json();

    // Walidacja przez Zod
    const validationResult = resetPasswordSchema.safeParse(body);
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

    const { email } = validationResult.data;

    // @ts-ignore - Cloudflare runtime
    const env = context.locals.runtime?.env || {};
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers, env });

    console.log("Attempting password reset for:", email);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/reset-password/confirm`,
    });

    if (error) {
      console.error("Password reset error:", error);
      return new Response(
        JSON.stringify({
          error: error.message || "Wystąpił błąd podczas wysyłania linku resetującego",
        }),
        {
          status: 400,
        }
      );
    }

    console.log("Password reset email sent successfully");

    return new Response(
      JSON.stringify({
        message: "Jeśli konto istnieje, wysłaliśmy link resetujący na podany adres email",
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Reset password API error:", error);
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
