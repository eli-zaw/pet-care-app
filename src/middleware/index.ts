import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    console.log('Middleware started for path:', url.pathname);

    try {
      // Dynamic import to avoid loading issues during middleware initialization
      const { createSupabaseServerInstance } = await import('../db/supabase.client');
      console.log('Dynamic import successful');

      // Inicjalizacja Supabase server instance
      const supabase = createSupabaseServerInstance({
        cookies,
        headers: request.headers,
      });
      console.log('Supabase instance created successfully');

      locals.supabase = supabase;

      // IMPORTANT: Always get user session first before any other operations
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('User check completed, user:', !!user, 'error:', !!userError);

      if (userError) {
        console.error('Error getting user:', userError);
      }

      if (user) {
        locals.user = {
          email: user.email,
          id: user.id,
        };
      } else {
        locals.user = null;
      }

      // Sprawdź czy trasa wymaga ochrony
      const isProtectedRoute = url.pathname.startsWith('/dashboard') ||
                              url.pathname.startsWith('/pets');

      // Sprawdź czy to trasa tylko dla niezalogowanych
      const isAuthOnlyRoute = url.pathname === '/login' ||
                             url.pathname === '/register';

      console.log('Route analysis:', {
        pathname: url.pathname,
        isProtectedRoute,
        isAuthOnlyRoute,
        user: !!user
      });

      // Jeśli chroniona trasa i użytkownik niezalogowany → przekieruj do logowania
      if (isProtectedRoute && !user) {
        const redirectUrl = `/login?redirect=${encodeURIComponent(url.pathname)}`;
        console.log('Redirecting to login:', redirectUrl);
        return redirect(redirectUrl);
      }

      // Jeśli trasa tylko dla niezalogowanych i użytkownik zalogowany → przekieruj do dashboardu
      if (isAuthOnlyRoute && user) {
        console.log('Redirecting authenticated user to dashboard');
        return redirect('/dashboard');
      }

      console.log('Middleware completed successfully for path:', url.pathname);
      return next();
    } catch (error) {
      console.error('Middleware error:', error);
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);

      // W przypadku błędu, ustaw domyślne wartości i pozwól kontynuować
      locals.supabase = null;
      locals.user = null;
      return next();
    }
  },
);
