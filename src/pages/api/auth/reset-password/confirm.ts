import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../../db/supabase.client';
import { resetPasswordConfirmSchema } from '../../../lib/schemas/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    // Walidacja przez Zod
    const validationResult = resetPasswordConfirmSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(JSON.stringify({
        error: validationResult.error.errors[0].message
      }), {
        status: 400,
      });
    }

    const { accessToken, newPassword } = validationResult.data;

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    console.log('Attempting to verify access token');

    // Weryfikacja tokenu
    const { data: userData, error: verifyError } = await supabase.auth.getUser(accessToken);

    if (verifyError || !userData.user) {
      console.error('Token verification failed:', verifyError);
      return new Response(JSON.stringify({
        error: "Token wygasł lub jest nieprawidłowy"
      }), {
        status: 400,
      });
    }

    console.log('Token verified, updating password for user:', userData.user.email);

    // Aktualizacja hasła
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return new Response(JSON.stringify({
        error: updateError.message || "Nie udało się zmienić hasła"
      }), {
        status: 400,
      });
    }

    console.log('Password updated successfully');

    return new Response(JSON.stringify({
      message: "Hasło zostało zmienione"
    }), {
      status: 200,
    });
  } catch (error) {
    console.error('Reset password confirm API error:', error);
    return new Response(JSON.stringify({
      error: "Wystąpił błąd serwera"
    }), {
      status: 500,
    });
  }
};