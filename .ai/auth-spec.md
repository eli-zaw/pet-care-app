# Specyfikacja Techniczna - Moduł Uwierzytelniania dla Paw Notes

## 1. Wprowadzenie

Niniejszy dokument opisuje architekturę i szczegóły implementacyjne modułu uwierzytelniania, autoryzacji oraz zarządzania kontem użytkownika w aplikacji `Paw Notes`. Rozwiązanie opiera się na wymaganiach `US-001`, `US-002`, `US-017` z dokumentu PRD oraz wykorzystuje `Supabase Auth` jako dostawcę usług autentykacji, zintegrowanego z frameworkiem `Astro` w trybie renderowania po stronie serwera (SSR).

### Architektura Server-Side Auth

```
React Components → Auth Service → API Endpoints → Supabase Auth
                                        ↓
                                   HTTP Cookies
                                        ↓
                                   Middleware
```

## 2. Architektura Interfejsu Użytkownika (Frontend)

Interfejs użytkownika zostanie podzielony na dwie główne strefy: publiczną (dla niezalogowanych użytkowników) i prywatną (dla zalogowanych).

### 2.1. Układy (Layouts)

- **`src/layouts/Layout.astro` (modyfikacja istniejącego)**
  - **Opis:** Główny layout aplikacji, używany na wszystkich stronach.
  - **Funkcje:**
    - Globalny nagłówek z logo (ikona łapki 🐾) i nazwą aplikacji
    - Komponent `LogoutButton.tsx` w nagłówku dla zalogowanych użytkowników
    - Logo prowadzi do `/dashboard` dla zalogowanych, `/` dla niezalogowanych
    - Header widoczny na stronach dashboard, ukryty na stronach auth (`hideHeader={true}`)
    - Landing page używa `hideHeader` dla czystszego wyglądu
  - **Renderowanie warunkowe:** Przycisk wylogowania widoczny tylko gdy `session?.user` istnieje

### 2.2. Strony (Pages)

Szczegółowe plany implementacji widoków znajdują się w osobnych plikach:

- **Rejestracja:** `.ai/register-view-implementation-plan.md`
- **Logowanie:** `.ai/login-view-implementation-plan.md`
- **Reset hasła (żądanie):** `.ai/reset-password-request-view-implementation-plan.md`
- **Reset hasła (potwierdzenie):** `.ai/reset-password-confirm-view-implementation-plan.md`

#### Przegląd stron:

- **`src/pages/index.astro` (istniejąca)**
  - **Opis:** Landing page - publiczna strona główna
  - **Logika:** Server-side sprawdza sesję przez `supabase.auth.getSession()` i przekierowuje zalogowanych do `/dashboard`
  - **Zawartość:** Komponent `Hero.astro` z CTA do rejestracji i logowania

- **`src/pages/register.astro` (nowa)**
  - **Ścieżka:** `/register`
  - **Dostęp:** Publiczny (tylko dla niezalogowanych)
  - **Zawartość:** `RegisterForm.tsx` (`client:load`), link do `/login`
  - **Server-side:** Sprawdzenie sesji, przekierowanie zalogowanych do `/dashboard`
  - **Layout:** `Layout.astro` z ukrytym headerem (`hideHeader={true}`), jasne tło aplikacji

- **`src/pages/login.astro` (nowa)**
  - **Ścieżka:** `/login`
  - **Dostęp:** Publiczny (tylko dla niezalogowanych)
  - **Zawartość:** `LoginForm.tsx` (`client:load`), link do `/register` i `/reset-password`
  - **Server-side:** Sprawdzenie sesji, obsługa parametru `?redirect` (UX enhancement: umożliwia powrót do strony, z której użytkownik został przekierowany do logowania)
  - **Layout:** `Layout.astro` z ukrytym headerem (`hideHeader={true}`), jasne tło aplikacji

- **`src/pages/reset-password.astro` (nowa)**
  - **Ścieżka:** `/reset-password`
  - **Dostęp:** Publiczny
  - **Zawartość:** `ResetPasswordRequestForm.tsx` (`client:load`)
  - **Server-side:** Dla niezalogowanych przekierowanie do `/dashboard` opcjonalne
  - **Layout:** `Layout.astro` z ukrytym headerem (`hideHeader={true}`), jasne tło aplikacji

- **`src/pages/reset-password/confirm.astro` (nowa)**
  - **Ścieżka:** `/reset-password/confirm`
  - **Dostęp:** Publiczny (wymaga tokenu z URL)
  - **Zawartość:** `ResetPasswordConfirmForm.tsx` (`client:load`), otrzymuje `accessToken` jako prop
  - **Server-side:** Ekstrakcja `access_token` i `type=recovery` z URL, walidacja tokenu, przekierowanie przy błędzie
  - **Layout:** `Layout.astro` z ukrytym headerem (`hideHeader={true}`), jasne tło aplikacji

- **`src/pages/dashboard.astro` (istniejąca)**
  - **Ścieżka:** `/dashboard`
  - **Ochrona:** Middleware zapewnia dostęp tylko dla zalogowanych
  - **Zawartość:** Dashboard użytkownika z listą zwierząt

- **`src/pages/pets/*` (istniejące)**
  - **Ochrona:** Middleware zapewnia dostęp tylko dla zalogowanych
  - **Zawartość:** Zarządzanie zwierzętami i wpisami opieki

### 2.3. Komponenty Auth (React)

Komponenty formularzy w `src/components/auth/`. Szczegóły implementacji w odpowiednich planach widoków.

- **`src/components/auth/RegisterForm.tsx`**
  - **Pola:** `email`, `password`, `confirmPassword`
  - **Walidacja:** Format email (regex), hasło min 8 znaków, potwierdzenie hasła zgodne z hasłem
  - **Logika:** POST `/api/auth/register` → toast sukcesu → redirect `/dashboard`
  - **Elementy UI:** Shadcn/ui (Card, Input, Button, Label), inline error messages
  - **Stan:** `useState` dla email, password, confirmPassword, isSubmitting, errors

- **`src/components/auth/LoginForm.tsx`**
  - **Props:** `redirectUrl?: string` (domyślnie `/dashboard`)
  - **Pola:** `email`, `password`
  - **Walidacja:** Format email, hasło wymagane (bez minimalnej długości)
  - **Logika:** POST `/api/auth/login` → redirect do `redirectUrl`
  - **Elementy UI:** Link "Zapomniałeś hasła?" → `/reset-password`, link do rejestracji
  - **Bezpieczeństwo:** Zawsze "Nieprawidłowy email lub hasło" (nie ujawnia czy email istnieje)

- **`src/components/auth/ResetPasswordRequestForm.tsx`**
  - **Pola:** `email`
  - **Walidacja:** Format email
  - **Logika:** POST `/api/auth/reset-password` → wyświetlenie komunikatu sukcesu (zawsze, nawet jeśli email nie istnieje)
  - **Elementy UI:** Dwa stany: formularz i komunikat sukcesu
  - **Bezpieczeństwo:** Nie ujawnia czy email istnieje w bazie

- **`src/components/auth/ResetPasswordConfirmForm.tsx`**
  - **Props:** `accessToken: string`
  - **Pola:** `password`, `confirmPassword`
  - **Walidacja:** Hasło min 8 znaków, zgodność haseł
  - **Logika:** POST `/api/auth/reset-password/confirm` → toast sukcesu → redirect `/login`
  - **Obsługa błędów:** Token wygasły → komunikat + link do `/reset-password`

- **`src/components/auth/LogoutButton.tsx`**
  - **Logika:** POST `/api/auth/logout` → redirect `/`
  - **UI:** Ikona LogOut (lucide-react), responsywny (ikona na mobile, ikona+tekst na desktop)
  - **Touch target:** Min 44x44px na mobile

### 2.4. Walidacja i Obsługa Błędów

- **Client-side:**
  - Walidacja on blur dla każdego pola
  - Wyświetlanie błędów inline pod polami
  - `aria-invalid` i `aria-describedby` dla accessibility
  - Disabled state podczas submitu

- **Server-side:**
  - Zod schemas w API endpoints
  - Szczegółowe komunikaty błędów
  - Kody HTTP: 400 (walidacja), 401 (unauthorized), 409 (conflict), 500 (server error)

- **Komunikaty błędów:**
  - Email: "Email jest wymagany", "Nieprawidłowy format email"
  - Hasło: "Hasło jest wymagane", "Hasło musi mieć minimum 8 znaków"
  - Potwierdzenie: "Hasła nie są identyczne"
  - Rejestracja 409: "Ten email jest już zarejestrowany"
  - Logowanie 401: "Nieprawidłowy email lub hasło"

## 3. Logika Backendowa

### 3.1. Astro Middleware (`src/middleware/index.ts`)

**Odpowiedzialności:**

1. Inicjalizacja Supabase client w `context.locals.supabase`
2. Pobranie sesji użytkownika przez `supabase.auth.getSession()`
3. Ochrona chronionych tras (wszystkie zaczynające się od `/dashboard` i `/pets`)
4. Przekierowanie niezalogowanych do `/login?redirect=<current-path>`
5. Przekierowanie zalogowanych z `/login` i `/register` do `/dashboard`
6. Dodanie `user` do `context.locals` dla dostępu w stronach Astro

**Chronione trasy:**

- `/dashboard`
- `/pets/*`

**Auth-only trasy (tylko dla niezalogowanych):**

- `/login`
- `/register`

**Publiczne trasy:**

- `/` (landing page)
- `/reset-password`
- `/reset-password/confirm`
- `/api/*` (wszystkie API endpoints)

**Implementacja:**

```typescript
import { defineMiddleware } from "astro:middleware";

const protectedRoutes = ["/dashboard", "/pets"];
const authOnlyRoutes = ["/login", "/register"];

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  const {
    data: { session },
  } = await context.locals.supabase.auth.getSession();

  // Ochrona chronionych tras
  const isProtectedRoute = protectedRoutes.some((route) => context.url.pathname.startsWith(route));

  if (isProtectedRoute && !session?.user) {
    const redirectUrl = `/login?redirect=${encodeURIComponent(context.url.pathname)}`;
    return context.redirect(redirectUrl);
  }

  // Przekierowanie zalogowanych z auth-only routes
  const isAuthOnlyRoute = authOnlyRoutes.some((route) => context.url.pathname.startsWith(route));

  if (isAuthOnlyRoute && session?.user) {
    return context.redirect("/dashboard");
  }

  context.locals.user = session?.user || null;

  return next();
});
```

### 3.2. API Endpoints

Wszystkie endpointy w `src/pages/api/auth/`:

#### `POST /api/auth/register` (`register.ts`)

**Request body:**

```typescript
{ email: string, password: string }
```

**Walidacja (Zod):**

```typescript
const registerSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
});
```

**Logika:**

1. Parse i walidacja body przez Zod
2. `supabase.auth.signUp({ email, password })`
3. Automatyczne utworzenie sesji (Supabase zarządza cookies)
4. Response 201 Created z danymi użytkownika

**Response 201:**

```json
{
  "message": "Rejestracja zakończona sukcesem",
  "user": { "id": "uuid", "email": "user@example.com" }
}
```

**Response 409:** Email już istnieje  
**Response 400:** Błąd walidacji  
**Response 500:** Błąd serwera

---

#### `POST /api/auth/login` (`login.ts`)

**Request body:**

```typescript
{ email: string, password: string }
```

**Walidacja (Zod):**

```typescript
const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});
```

**Logika:**

1. Parse i walidacja body
2. `supabase.auth.signInWithPassword({ email, password })`
3. Supabase automatycznie ustawia cookies sesji
4. Response 200 OK

**Response 200:**

```json
{
  "message": "Logowanie zakończone sukcesem",
  "user": { "id": "uuid", "email": "user@example.com" }
}
```

**Response 401:** Nieprawidłowe dane (zawsze ten sam komunikat, nie ujawniamy czy email istnieje)  
**Response 400:** Błąd walidacji

---

#### `POST /api/auth/logout` (`logout.ts`)

**Request body:** brak

**Logika:**

1. `supabase.auth.signOut()`
2. Supabase automatycznie czyści cookies
3. Response 200 OK

**Response 200:**

```json
{ "message": "Wylogowanie zakończone sukcesem" }
```

---

#### `POST /api/auth/reset-password` (`reset-password.ts`)

**Request body:**

```typescript
{
  email: string;
}
```

**Walidacja (Zod):**

```typescript
const resetPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
});
```

**Logika:**

1. Parse i walidacja body
2. `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/reset-password/confirm' })`
3. Zawsze zwraca 200 OK (bezpieczeństwo - nie ujawniamy czy email istnieje)
4. Supabase wysyła email z linkiem (tylko jeśli user istnieje)

**Response 200 (zawsze):**

```json
{ "message": "Jeśli konto istnieje, wysłaliśmy link resetujący na podany adres email" }
```

---

#### `POST /api/auth/reset-password/confirm` (`reset-password/confirm.ts`)

**Request body:**

```typescript
{ accessToken: string, newPassword: string }
```

**Walidacja (Zod):**

```typescript
const resetPasswordConfirmSchema = z.object({
  accessToken: z.string().min(1, "Token jest wymagany"),
  newPassword: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
});
```

**Logika:**

1. Parse i walidacja body
2. `supabase.auth.getUser(accessToken)` - weryfikacja tokenu
3. Jeśli token nieprawidłowy → 400 Bad Request
4. `supabase.auth.updateUser({ password: newPassword })`
5. Response 200 OK

**Response 200:**

```json
{ "message": "Hasło zostało zmienione" }
```

**Response 400:** Token wygasły/nieprawidłowy lub błąd walidacji

**Uwaga:** Po zmianie hasła wszystkie aktywne sesje użytkownika pozostają aktywne (uproszczenie dla MVP, zgodnie z US-017)

### 3.3. Struktura plików backendowych

```
src/
├── pages/
│   ├── api/
│   │   └── auth/
│   │       ├── register.ts
│   │       ├── login.ts
│   │       ├── logout.ts
│   │       ├── reset-password.ts
│   │       └── reset-password/
│   │           └── confirm.ts
│   ├── login.astro
│   ├── register.astro
│   ├── reset-password.astro
│   └── reset-password/
│       └── confirm.astro
├── middleware/
│   └── index.ts
├── components/
│   └── auth/
│       ├── RegisterForm.tsx
│       ├── LoginForm.tsx
│       ├── ResetPasswordRequestForm.tsx
│       ├── ResetPasswordConfirmForm.tsx
│       └── LogoutButton.tsx
└── env.d.ts
```

## 4. System Autentykacji (Supabase Auth)

### 4.1. Konfiguracja

- **Pakiet:** `@supabase/supabase-js` (wersja dla JavaScript/TypeScript)
- **Klient:** `src/db/supabase.client.ts`

**Zmienne środowiskowe:**

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

**Konfiguracja klienta:**

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

### 4.2. Konfiguracja Supabase Dashboard

**Authentication:**

- **Email Provider:** Włączony
- **Email Confirmation:** Wyłączony dla MVP (opcjonalnie można włączyć w przyszłości)

**URL Configuration:**

- **Site URL:** `http://localhost:3000` (dev) / `https://your-domain.com` (prod)
- **Redirect URLs:**
  - `http://localhost:3000/reset-password/confirm`
  - `https://your-domain.com/reset-password/confirm`

**Email Templates:**

- **Password Reset:** Customowy template z linkiem `{{ .ConfirmationURL }}`
- **Subject:** "Resetowanie hasła - Paw Notes"

### 4.3. Zarządzanie sesjami

**Mechanizm:**

- JWT tokens w cookies (server-side) i localStorage (client-side)
- Access token - ważny 1 godzinę
- Refresh token - ważny 30 dni
- Automatyczne odświeżanie przez Supabase client

**Cookies:**

```
sb-<project-ref>-auth-token
sb-<project-ref>-auth-token-code-verifier
```

**Atrybuty cookies:**

- `httpOnly: true` (zabezpieczenie przed XSS)
- `secure: true` (tylko HTTPS w prod)
- `sameSite: lax` (zabezpieczenie przed CSRF)
- `path: /`

**Session validation:**

```typescript
// W middleware
const {
  data: { session },
} = await supabase.auth.getSession();

// W API endpoints
const {
  data: { user },
  error,
} = await supabase.auth.getUser();
```

### 4.4. Struktura bazy danych

**Tabela `auth.users` (zarządzana przez Supabase):**

- Automatycznie tworzona i zarządzana przez Supabase Auth
- Nie modyfikujemy bezpośrednio
- Pola: `id`, `email`, `encrypted_password`, `created_at`, etc.

**Tabela `public.profiles` (istniejąca w aplikacji):**

- Powiązana z `auth.users` przez `user_id`
- Trigger automatycznie tworzy profil po rejestracji
- Pola: `id`, `user_id`, `email`, `created_at`, `updated_at`

**SQL Trigger dla automatycznego tworzenia profilu:**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## 5. Podsumowanie Tras i Przepływów

### 5.1. Matryca Dostępu do Tras

| Trasa                     | Niezalogowany              | Zalogowany                     | Opis                    |
| ------------------------- | -------------------------- | ------------------------------ | ----------------------- |
| `/`                       | ✅ Dostęp                  | Przekierowanie do `/dashboard` | Landing page            |
| `/login`                  | ✅ Dostęp                  | Przekierowanie do `/dashboard` | Formularz logowania     |
| `/register`               | ✅ Dostęp                  | Przekierowanie do `/dashboard` | Formularz rejestracji   |
| `/reset-password`         | ✅ Dostęp                  | ✅ Dostęp                      | Formularz resetu hasła  |
| `/reset-password/confirm` | ✅ Dostęp                  | ✅ Dostęp                      | Formularz zmiany hasła  |
| `/dashboard`              | Przekierowanie do `/login` | ✅ Dostęp                      | Dashboard użytkownika   |
| `/pets/*`                 | Przekierowanie do `/login` | ✅ Dostęp                      | Zarządzanie zwierzętami |

### 5.2. Przepływy Użytkownika

**Przepływ rejestracji (US-001):**

1. Użytkownik → `/register`
2. Server-side sprawdza sesję, niezalogowany widzi formularz
3. Wypełnia `RegisterForm.tsx` (email, password, confirmPassword)
4. Client-side walidacja on blur
5. Submit → POST `/api/auth/register`
6. API waliduje Zod, wywołuje `supabase.auth.signUp()`
7. Automatyczne utworzenie sesji (cookies ustawione przez Supabase)
8. Response 201 → toast "Witaj w Paw Notes" → redirect `/dashboard`

**Przepływ logowania (US-002):**

1. Użytkownik → `/login` (lub przekierowanie z chronionej trasy)
2. Server-side sprawdza sesję, ekstrakcja parametru `?redirect`
3. Wypełnia `LoginForm.tsx` (email, password)
4. Client-side walidacja
5. Submit → POST `/api/auth/login`
6. API wywołuje `supabase.auth.signInWithPassword()`
7. Sesja utworzona (cookies ustawione)
8. Response 200 → redirect do `redirectUrl` (domyślnie `/dashboard`)

**Przepływ wylogowania (US-003):**

1. Zalogowany użytkownik klika `LogoutButton.tsx` w headerze
2. Client-side → POST `/api/auth/logout`
3. API wywołuje `supabase.auth.signOut()`
4. Cookies usunięte
5. Response 200 → redirect `/`
6. Landing page sprawdza sesję → brak sesji → wyświetla Hero

**Przepływ resetu hasła (US-017):**

_Część 1: Żądanie resetu_

1. Użytkownik → `/reset-password`
2. Wypełnia `ResetPasswordRequestForm.tsx` (email)
3. Submit → POST `/api/auth/reset-password`
4. API wywołuje `supabase.auth.resetPasswordForEmail()`
5. Response 200 (zawsze) → komunikat sukcesu
6. Jeśli email istnieje, Supabase wysyła email z linkiem

_Część 2: Ustawienie nowego hasła_ 7. Użytkownik klika link w emailu → `/reset-password/confirm?access_token=XXX&type=recovery` 8. Server-side ekstrakcja tokenu, walidacja przez `supabase.auth.getUser(token)` 9. Jeśli token nieprawidłowy → redirect `/reset-password?error=invalid_token` 10. Jeśli OK → render `ResetPasswordConfirmForm.tsx` (password, confirmPassword) 11. Client-side walidacja (długość, zgodność) 12. Submit → POST `/api/auth/reset-password/confirm` 13. API wywołuje `supabase.auth.updateUser({ password })` 14. Response 200 → toast "Hasło zostało zmienione" → redirect `/login`

**Przepływ middleware (przy każdym żądaniu):**

1. Request → middleware
2. Inicjalizacja `context.locals.supabase`
3. Pobranie sesji `supabase.auth.getSession()`
4. Sprawdzenie czy trasa jest chroniona
5. Jeśli chroniona i brak sesji → redirect `/login?redirect=...`
6. Jeśli auth-only i sesja istnieje → redirect `/dashboard`
7. Zapisanie `user` w `context.locals`
8. Przejście do next()

## 6. Bezpieczeństwo

### ✅ Implementowane w MVP

**XSS (Cross-Site Scripting):**

- React automatycznie escapuje content
- Cookies z `httpOnly: true`
- Zod sanityzacja inputów
- Brak `dangerouslySetInnerHTML`

**CSRF (Cross-Site Request Forgery):**

- Cookies z `sameSite: lax`
- Supabase JWT verification
- Origin validation w API

**SQL Injection:**

- Supabase Auth używa prepared statements
- Supabase client chroni przed SQL injection
- Brak bezpośredniego dostępu do SQL

**Enumeration:**

- Reset hasła zawsze zwraca sukces
- Logowanie nie ujawnia czy email istnieje ("Nieprawidłowy email lub hasło")
- Rejestracja 409 tylko gdy email istnieje (akceptowalne dla UX)

**Session Management:**

- HTTPOnly cookies niedostępne dla JavaScript
- Automatyczne odświeżanie tokenów
- 1h access token, 30 dni refresh token
- Server-side validation w middleware

### ⏳ Do implementacji (post-MVP)

- Row Level Security (RLS) w Supabase
- Rate limiting (brute force protection)
- Email verification przy rejestracji
- 2FA (opcjonalnie)
- CSP headers w reverse proxy

## 7. Walidacja i Schematy Zod

**Lokalizacja:** `src/lib/schemas/auth.ts` (do utworzenia)

```typescript
import { z } from "zod";

export const emailSchema = z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email");

export const passwordSchema = z.string().min(8, "Hasło musi mieć minimum 8 znaków");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordConfirmSchema = z.object({
  accessToken: z.string().min(1, "Token jest wymagany"),
  newPassword: passwordSchema,
});
```

## 8. Testowanie

### 8.1. Scenariusze testowe MVP

**Rejestracja (US-001):**

- [ ] Formularz renderuje się poprawnie
- [ ] Walidacja email (format, wymagane)
- [ ] Walidacja hasła (długość min 8, wymagane)
- [ ] Error messages inline pod polami
- [ ] Submit disabled podczas submitu
- [ ] Toast sukcesu
- [ ] Przekierowanie do `/dashboard`
- [ ] Email już istnieje → 409 + komunikat
- [ ] Link do logowania działa
- [ ] Responsywność (mobile/desktop)

**Logowanie (US-002):**

- [ ] Formularz renderuje się
- [ ] Walidacja email i hasła
- [ ] Nieprawidłowe dane → 401 + komunikat
- [ ] Przekierowanie do `/dashboard`
- [ ] Parametr `?redirect` działa
- [ ] Link "Zapomniałeś hasła?" → `/reset-password`
- [ ] Link do rejestracji działa
- [ ] Responsywność

**Wylogowanie (US-003):**

- [ ] Przycisk widoczny w headerze (zalogowani)
- [ ] Kliknięcie wylogowuje
- [ ] Przekierowanie do `/`
- [ ] Próba dostępu do `/dashboard` → redirect `/login`
- [ ] Responsywność (mobile: ikona, desktop: ikona+tekst)

**Reset hasła (US-017):**

- [ ] Formularz żądania renderuje się
- [ ] Walidacja email
- [ ] Submit → komunikat sukcesu (zawsze)
- [ ] Email wysyłany (sprawdzić inbox)
- [ ] Link w emailu → `/reset-password/confirm?access_token=...`
- [ ] Formularz nowego hasła renderuje się
- [ ] Walidacja hasła i potwierdzenia
- [ ] Niezgodność haseł → błąd
- [ ] Submit zmienia hasło
- [ ] Toast sukcesu → redirect `/login`
- [ ] Logowanie nowym hasłem działa
- [ ] Token wygasły → error message + link

**Middleware:**

- [ ] Niezalogowany → `/dashboard` → redirect `/login?redirect=/dashboard`
- [ ] Zalogowany → `/login` → redirect `/dashboard`
- [ ] Zalogowany → `/register` → redirect `/dashboard`
- [ ] Parametr `?redirect` zachowany po logowaniu
- [ ] Landing page `/` → zalogowany → redirect `/dashboard`

### 8.2. Manual Testing Checklist

**Accessibility:**

- [ ] `Label` dla wszystkich pól
- [ ] `aria-invalid` dla pól z błędami
- [ ] `aria-describedby` dla error messages
- [ ] Keyboard navigation działa
- [ ] Focus visible dla interaktywnych elementów
- [ ] Touch targets min 44x44px (mobile)

**Responsywność:**

- [ ] Mobile (<768px): pełna szerokość, przyciski pełnej szerokości
- [ ] Desktop (≥768px): max-w-md centered, normalne przyciski
- [ ] Gradient background wyświetla się poprawnie
- [ ] Font sizes 16px+ (zapobieganie auto-zoom mobile)

## 9. Rozwiązywanie Problemów

### Problem: "User already registered" przy każdej rejestracji

**Przyczyna:** Email już istnieje w bazie Supabase Auth.  
**Rozwiązanie:** Użyj innego emaila lub usuń użytkownika w Supabase Dashboard (Authentication → Users).

### Problem: Sesja nie jest widoczna po zalogowaniu

**Przyczyna:** Cookies nie są ustawiane lub middleware nie odczytuje poprawnie.  
**Rozwiązanie:**

- Sprawdź w DevTools → Application → Cookies czy `sb-<project>-auth-token` istnieje
- Sprawdź czy middleware wywołuje `getSession()` poprawnie
- Upewnij się że Supabase client ma `persistSession: true`

### Problem: Infinite redirect loop

**Przyczyna:** Middleware i strony mają konflikty w logice przekierowań.  
**Rozwiązanie:**

- Upewnij się że landing page `/` nie jest w `protectedRoutes`
- Sprawdź że `/login` i `/register` są w `authOnlyRoutes`
- Sprawdź czy middleware nie przekierowuje API endpoints

### Problem: Token wygasły przy resecie hasła

**Przyczyna:** Token z emaila jest ważny tylko 1 godzinę.  
**Rozwiązanie:** Link musi być użyty w ciągu godziny. Po wygaśnięciu należy wysłać nowy request.

### Problem: Email resetujący nie wysyłany

**Przyczyna:** Konfiguracja email w Supabase Dashboard lub błędny redirect URL.  
**Rozwiązanie:**

- Sprawdź Auth → Email Templates w Supabase Dashboard
- Sprawdź Auth → URL Configuration → Redirect URLs
- W development Supabase używa własnego SMTP (rate limited)

## 10. Zgodność z Wymaganiami PRD

### Pokrycie User Stories

| User Story                      | Status | Implementacja                                                 |
| ------------------------------- | ------ | ------------------------------------------------------------- |
| US-001: Rejestracja użytkownika | ✅ MVP | `register.astro` + `RegisterForm.tsx` + API                   |
| US-002: Logowanie użytkownika   | ✅ MVP | `login.astro` + `LoginForm.tsx` + API                         |
| US-003: Wylogowanie użytkownika | ✅ MVP | `LogoutButton.tsx` + API                                      |
| US-017: Resetowanie hasła       | ✅ MVP | `reset-password.astro` + `reset-password/confirm.astro` + API |

### Wymagania Funkcjonalne (FR)

**FR-018: Resetowanie hasła** - ✅ Kompletna implementacja:

- Link resetujący wysyłany na email
- Ważność linku: 1 godzina
- Nowe hasło minimum 8 znaków
- Toast "Hasło zostało zmienione"
- Przekierowanie do strony logowania
- Wykorzystuje Supabase Auth

**FR-001 do FR-016:** Chronione przez middleware - dostęp tylko dla zalogowanych użytkowników.

## 11. Diagram Architektury

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  Landing Page    │  │   Auth Pages     │  │ Protected    │ │
│  │  (index.astro)   │  │ (login/register) │  │ Pages        │ │
│  │                  │  │                  │  │ (dashboard)  │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
│           │                     │                    │         │
│           └─────────────────────┼────────────────────┘         │
│                                 │                              │
└─────────────────────────────────┼──────────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   ASTRO MIDDLEWARE        │
                    │  (Session Check)          │
                    │  - Protected Routes       │
                    │  - Auth Redirects         │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     ASTRO SERVER (SSR)    │
                    ├───────────────────────────┤
                    │  API Routes:              │
                    │  - /api/auth/register     │
                    │  - /api/auth/login        │
                    │  - /api/auth/logout       │
                    │  - /api/auth/reset-*      │
                    │  - /api/pets/*            │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   SUPABASE AUTH           │
                    ├───────────────────────────┤
                    │  - User Management        │
                    │  - JWT Tokens             │
                    │  - Session Management     │
                    │  - Password Reset         │
                    │  - Email Service          │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   POSTGRESQL DATABASE     │
                    ├───────────────────────────┤
                    │  Tables:                  │
                    │  - auth.users             │
                    │  - public.profiles        │
                    │  - public.pets            │
                    │  - public.care_entries    │
                    └───────────────────────────┘
```

## 12. Podsumowanie

Specyfikacja obejmuje kompletny system autentykacji dla Paw Notes MVP, wykorzystujący Supabase Auth jako dostawcę autentykacji.

**Kluczowe elementy:**

1. **Cztery główne flow:** Rejestracja, logowanie, wylogowanie, reset hasła
2. **Adaptacyjny header:** Nagłówek widoczny na stronach dashboard, ukryty na stronach auth
3. **Jasna kolorystyka:** Wszystkie strony używają jasnego motywu kolorystycznego aplikacji
4. **SSR rendering:** Wszystkie strony renderowane server-side
5. **Middleware protection:** Automatyczna ochrona chronionych tras
6. **React formularze:** Interaktywne formularze z walidacją client-side i server-side
7. **Supabase Auth:** Zarządzanie użytkownikami, sesjami i emailami
8. **Bezpieczeństwo:** XSS, CSRF, SQL injection, enumeration protection
9. **Responsywność:** Mobile-first design (768px breakpoint)
10. **Accessibility:** WCAG AA compliance

**Szczegółowe plany implementacji widoków:**

- `.ai/register-view-implementation-plan.md`
- `.ai/login-view-implementation-plan.md`
- `.ai/reset-password-request-view-implementation-plan.md`
- `.ai/reset-password-confirm-view-implementation-plan.md`

Implementacja nie narusza istniejącej funkcjonalności aplikacji i zapewnia płynną integrację z istniejącymi komponentami.
