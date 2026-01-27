import type { AstroCookies } from 'astro';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import type { Database } from './database.types';

export const cookieOptions: CookieOptionsWithName = {
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'lax',
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  // Użyj wartości domyślnych jeśli zmienne środowiskowe nie są dostępne
  const supabaseUrl = import.meta.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = import.meta.env.SUPABASE_KEY || 'placeholder-key';

  console.log('Creating Supabase instance with:', {
    url: supabaseUrl,
    keyPresent: !!supabaseKey,
    keyLength: supabaseKey.length,
    isPlaceholder: supabaseUrl === 'https://placeholder.supabase.co'
  });

  // Sprawdź czy mamy prawidłowe credentials
  if (supabaseUrl === 'https://placeholder.supabase.co' || !supabaseKey || supabaseKey === 'placeholder-key') {
    console.error('Invalid Supabase credentials:', {
      url: supabaseUrl,
      keyPresent: !!supabaseKey,
      keyLength: supabaseKey.length
    });
    throw new Error('Supabase credentials not configured. Please check your .env file.');
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return parseCookieHeader(context.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            context.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  console.log('Supabase instance created');
  return supabase;
};

// Zachowaj kompatybilność wsteczną dla istniejącego kodu
import { createClient } from "@supabase/supabase-js";
export const supabaseClient = createClient<Database>(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_KEY
);

export type SupabaseClient = typeof supabaseClient;
