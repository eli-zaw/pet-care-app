# Plan implementacji widoku: Logowanie

## 1. Przegląd
Widok logowania umożliwia użytkownikom z istniejącymi kontami uwierzytelnienie się w aplikacji. Po pomyślnym logowaniu użytkownik jest przekierowywany do dashboardu lub do strony określonej przez parametr `?redirect`.

## 2. Routing widoku
Ścieżka: `/login` (publiczny, tylko dla niezalogowanych)

Logika przekierowania:
- Użytkownik niezalogowany: wyświetla formularz logowania
- Użytkownik zalogowany: automatyczne przekierowanie do `/dashboard`
- Parametr `?redirect`: po logowaniu przekierowanie do określonej strony

## 3. Struktura komponentów
- `LoginPage` (Astro page - `login.astro`)
- `LoginForm` (React component - `client:load`)

## 4. Szczegóły komponentów

### `LoginPage` (login.astro)
- Opis komponentu: Strona Astro renderująca formularz logowania z server-side sprawdzeniem sesji i obsługą parametru redirect.
- Główne elementy: `Layout` z `hideHeader={true}`, gradient background, `LoginForm` component.
- Obsługiwane interakcje: brak (statyczna strona Astro).
- Obsługiwana walidacja: server-side sprawdzenie sesji, ekstrakcja parametru `?redirect`.
- Typy: brak specyficznych typów.
- Propsy: brak (top-level page).

**Struktura:**
```astro
---
import Layout from "@/layouts/Layout.astro";
import { LoginForm } from "@/components/auth/LoginForm";

// Server-side: sprawdzenie sesji
const { data: { session } } = await Astro.locals.supabase.auth.getSession();
if (session?.user) {
  return Astro.redirect("/dashboard");
}

// Obsługa redirect parameter
const redirectUrl = Astro.url.searchParams.get("redirect") || "/dashboard";
---

<Layout title="Logowanie - Pet Care Companion" hideHeader>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
    <LoginForm client:load redirectUrl={redirectUrl} />
  </div>
</Layout>
```

### `LoginForm` (LoginForm.tsx)
- Opis komponentu: Formularz logowania z walidacją client-side, komunikacją z API i obsługą błędów.
- Główne elementy:
  - `Card` (Shadcn/ui): kontener formularza
  - `Input` dla email i hasła
  - `Button` typu submit
  - Inline error messages
  - Link "Zapomniałeś hasła?"
  - Link do rejestracji
- Obsługiwane interakcje:
  - Walidacja on blur dla email
  - Submit formularza → POST /api/auth/login
  - Kliknięcie "Zapomniałeś hasła?" → nawigacja do /reset-password
  - Kliknięcie linku rejestracji → nawigacja do /register
- Obsługiwana walidacja:
  - Email: wymagany, format email
  - Hasło: wymagane (bez walidacji długości przy logowaniu)
- Typy: `LoginFormState`, `LoginFormProps`
- Propsy: `redirectUrl?: string` (domyślnie "/dashboard")

**Interfejs props:**
```typescript
interface LoginFormProps {
  redirectUrl?: string; // Domyślnie "/dashboard"
}
```

**Interfejs stanu:**
```typescript
interface LoginFormState {
  email: string;
  password: string;
  isSubmitting: boolean;
  errors: {
    email?: string;
    password?: string;
    general?: string;
  };
}
```

**Kluczowe funkcje:**
- `validateEmail(email: string): string | undefined`
- `validatePassword(password: string): string | undefined` - tylko sprawdza czy nie puste
- `handleSubmit(e: FormEvent): Promise<void>`

## 5. Typy
Typy definiowane lokalnie w komponencie:
- `LoginFormProps`
- `LoginFormState`

## 6. Zarządzanie stanem
Stan lokalny w komponencie `LoginForm`:
- `formState: LoginFormState` - zawiera email, password, isSubmitting, errors
- `useState` dla zarządzania stanem formularza
- Props `redirectUrl` przekazywany z Astro page

## 7. Integracja API

### Endpoint: POST /api/auth/login
**Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Response 200 OK:**
```json
{
  "message": "Logowanie zakończone sukcesem",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Response 401 Unauthorized:**
```json
{
  "message": "Nieprawidłowy email lub hasło"
}
```

**Response 400 Bad Request:**
```json
{
  "message": "Błąd walidacji",
  "errors": [...]
}
```

**Akcje frontendowe:**
- Wywołanie `fetch("/api/auth/login", { method: "POST", ... })`
- Obsługa odpowiedzi 200: redirect do `redirectUrl`
- Obsługa błędów: toast "Nieprawidłowy email lub hasło"

## 8. Interakcje użytkownika

### Wejście na `/login` jako niezalogowany
- System wyświetla formularz logowania
- Pola: email, hasło
- Link "Zapomniałeś hasła?"
- Przycisk "Zaloguj się"
- Link "Nie masz konta? Zarejestruj się"

### Wejście na `/login?redirect=/pets/123` jako niezalogowany
- System wyświetla formularz logowania
- Po zalogowaniu: przekierowanie do `/pets/123`

### Wejście na `/login` jako zalogowany
- System sprawdza sesję server-side
- Automatyczne przekierowanie do `/dashboard`

### Wypełnianie formularza
- Wprowadzenie email → walidacja on blur (format)
- Wprowadzenie hasła → walidacja on blur (wymagane)
- Błędy wyświetlane inline pod polami
- Przycisk disabled gdy `isSubmitting`

### Submit formularza
- Walidacja client-side
- Jeśli błędy → wyświetlenie error messages, brak wywołania API
- Jeśli OK → POST /api/auth/login
- Podczas submitu: przycisk disabled, tekst "Logowanie..."

### Sukces logowania
- Brak toasta (dashboard wyświetli się natychmiast)
- Przekierowanie do `redirectUrl` (domyślnie `/dashboard`)
- Użytkownik zalogowany (sesja utworzona przez API)

### Błąd logowania
- Toast: "Nieprawidłowy email lub hasło"
- Error message ogólny pod formularzem
- Przycisk aktywny ponownie
- Nie ujawniamy czy email istnieje

### Kliknięcie "Zapomniałeś hasła?"
- Nawigacja do `/reset-password`

### Kliknięcie "Nie masz konta? Zarejestruj się"
- Nawigacja do `/register`

### Responsywność
- Desktop (≥768px): Card max-w-md, centered
- Mobile (<768px): Card pełna szerokość, przyciski pełna szerokość min 44x44px

## 9. Warunki i walidacja

### Walidacja email
- Wymagany: nie może być pusty
- Format: musi zawierać @ i domenę
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Walidacja on blur
- Error message: "Email jest wymagany" lub "Nieprawidłowy format email"

### Walidacja hasła
- Wymagane: nie może być puste
- Brak walidacji długości przy logowaniu (tylko sprawdzamy czy nie puste)
- Walidacja on blur
- Error message: "Hasło jest wymagane"

### Walidacja przed submitem
- Sprawdzenie obu pól
- Jeśli błędy → ustawienie w state, brak wywołania API
- Wyświetlenie error messages

### Bezpieczeństwo
- Nie ujawniamy czy email istnieje w bazie
- Zawsze: "Nieprawidłowy email lub hasło" (401)
- Brak różnicy w komunikacie dla nieistniejącego email vs złe hasło

### Accessibility
- `Label` dla każdego pola
- `aria-invalid` dla pól z błędami
- `aria-describedby` dla error messages
- Focus visible dla wszystkich interaktywnych elementów
- Keyboard navigation

## 10. Obsługa błędów

### 401 Unauthorized (Nieprawidłowe dane)
- Toast: "Nieprawidłowy email lub hasło"
- Error message ogólny pod formularzem: "Nieprawidłowy email lub hasło"
- Przycisk aktywny ponownie
- Fokus na polu email

### 400 Bad Request (Błąd walidacji)
- Toast: "Błąd walidacji"
- Wyświetlenie error messages przy polach
- Przycisk aktywny ponownie

### 500 Internal Server Error
- Toast: "Wystąpił błąd podczas logowania"
- Error message ogólny
- Przycisk aktywny ponownie

### Błąd sieci
- Toast: "Brak połączenia. Sprawdź internet."
- Error message ogólny
- Przycisk aktywny ponownie

### Edge cases
- Użytkownik próbuje zalogować się na nieistniejący email → 401 + ogólny komunikat
- Użytkownik wpisuje nieprawidłowe hasło → 401 + ogólny komunikat
- Parametr `?redirect` z nieprawidłowym URL → sanityzacja lub domyślnie `/dashboard`

## 11. Kroki implementacji

1. **Utworzyć stronę `src/pages/login.astro`:**
   - Dodać server-side sprawdzenie sesji
   - Przekierowanie zalogowanych do `/dashboard`
   - Ekstrakcja parametru `?redirect` z URL
   - Renderowanie `Layout` z `hideHeader={true}`
   - Gradient background

2. **Utworzyć komponent `src/components/auth/LoginForm.tsx`:**
   - Import Shadcn/ui components
   - Zdefiniować interfejsy `LoginFormProps` i `LoginFormState`
   - Zaimplementować `useState` dla stanu formularza
   - Odebranie `redirectUrl` jako prop

3. **Zaimplementować funkcje walidacji:**
   - `validateEmail` - sprawdzenie formatu email
   - `validatePassword` - sprawdzenie czy nie puste (bez długości)
   - Walidacja on blur dla każdego pola

4. **Zaimplementować `handleSubmit`:**
   - Walidacja client-side przed wysłaniem
   - Wywołanie `fetch("/api/auth/login")`
   - Obsługa odpowiedzi 200: redirect do `redirectUrl`
   - Obsługa błędów: toast + error message (zawsze ten sam komunikat)

5. **Zbudować UI formularza:**
   - Card z CardHeader, CardContent, CardFooter
   - Input dla email z walidacją
   - Input dla hasła z walidacją
   - Link "Zapomniałeś hasła?" (text-right, przed buttonem)
   - Button submit z disabled state
   - Link do rejestracji w CardFooter

6. **Dodać responsywność:**
   - Tailwind classes dla mobile-first
   - `max-w-md` dla desktop
   - `w-full` dla mobile
   - Touch targets min 44x44px

7. **Dodać accessibility:**
   - `Label` dla każdego pola
   - `aria-invalid` dla pól z błędami
   - `aria-describedby` dla error messages
   - Keyboard navigation

8. **Przetestować:**
   - Logowanie z poprawnymi danymi
   - Logowanie z nieprawidłowymi danymi (401)
   - Parametr `?redirect` działa
   - Walidacja email i hasła
   - Link "Zapomniałeś hasła?"
   - Link do rejestracji
   - Responsywność (mobile/desktop)
   - Accessibility (keyboard, screen reader)

9. **Integracja:**
   - Sprawdzić działanie z API endpoint
   - Sprawdzić przekierowanie do `redirectUrl`
   - Sprawdzić toast notifications
   - Sprawdzić linki do innych stron
