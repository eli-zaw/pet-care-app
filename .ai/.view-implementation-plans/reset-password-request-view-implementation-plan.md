# Plan implementacji widoku: Resetowanie hasła - żądanie linku

## 1. Przegląd
Widok żądania resetowania hasła umożliwia użytkownikom, którzy zapomnieli hasła, wysłanie linku resetującego na ich adres email. Po wysłaniu żądania użytkownik widzi komunikat potwierdzający.

## 2. Routing widoku
Ścieżka: `/reset-password` (publiczny, tylko dla niezalogowanych)

Logika przekierowania:
- Użytkownik niezalogowany: wyświetla formularz żądania resetu
- Użytkownik zalogowany: automatyczne przekierowanie do `/dashboard`

## 3. Struktura komponentów
- `ResetPasswordRequestPage` (Astro page - `reset-password.astro`)
- `ResetPasswordRequestForm` (React component - `client:load`)

## 4. Szczegóły komponentów

### `ResetPasswordRequestPage` (reset-password.astro)
- Opis komponentu: Strona Astro renderująca formularz żądania resetu z server-side sprawdzeniem sesji.
- Główne elementy: `Layout` z `hideHeader={true}`, gradient background, `ResetPasswordRequestForm` component.
- Obsługiwane interakcje: brak (statyczna strona Astro).
- Obsługiwana walidacja: server-side sprawdzenie sesji.
- Typy: brak specyficznych typów.
- Propsy: brak (top-level page).

**Struktura:**
```astro
---
import Layout from "@/layouts/Layout.astro";
import { ResetPasswordRequestForm } from "@/components/auth/ResetPasswordRequestForm";

// Server-side: sprawdzenie sesji
const { data: { session } } = await Astro.locals.supabase.auth.getSession();
if (session?.user) {
  return Astro.redirect("/dashboard");
}
---

<Layout title="Resetowanie hasła - Pet Care Companion" hideHeader>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
    <ResetPasswordRequestForm client:load />
  </div>
</Layout>
```

### `ResetPasswordRequestForm` (ResetPasswordRequestForm.tsx)
- Opis komponentu: Formularz żądania resetu hasła z walidacją email, komunikacją z API i dwoma stanami: formularz i komunikat sukcesu.
- Główne elementy:
  - Stan "formularz":
    - `Card` (Shadcn/ui): kontener formularza
    - `Input` dla email
    - `Button` typu submit
    - Inline error messages
    - Link powrotu do logowania
  - Stan "sukces":
    - `Card` z komunikatem sukcesu
    - Ikona sukcesu (🎉 lub check icon)
    - Opis "Sprawdź swoją skrzynkę email"
    - Przycisk "Powrót do logowania"
- Obsługiwane interakcje:
  - Walidacja on blur dla email
  - Submit formularza → POST /api/auth/reset-password
  - Kliknięcie "Powrót do logowania" → nawigacja do /login
- Obsługiwana walidacja:
  - Email: wymagany, format email
- Typy: `ResetPasswordRequestFormState`
- Propsy: brak

**Interfejs stanu:**
```typescript
interface ResetPasswordRequestFormState {
  email: string;
  isSubmitting: boolean;
  isSuccess: boolean; // true po pomyślnym wysłaniu
  errors: {
    email?: string;
    general?: string;
  };
}
```

**Kluczowe funkcje:**
- `validateEmail(email: string): string | undefined`
- `handleSubmit(e: FormEvent): Promise<void>`
- `renderForm(): JSX.Element` - stan formularza
- `renderSuccess(): JSX.Element` - stan sukcesu

## 5. Typy
Typy definiowane lokalnie w komponencie:
- `ResetPasswordRequestFormState`

## 6. Zarządzanie stanem
Stan lokalny w komponencie `ResetPasswordRequestForm`:
- `formState: ResetPasswordRequestFormState` - zawiera email, isSubmitting, isSuccess, errors
- `useState` dla zarządzania stanem formularza
- Przełączanie między `renderForm()` i `renderSuccess()` w zależności od `isSuccess`

## 7. Integracja API

### Endpoint: POST /api/auth/reset-password
**Request:**
```typescript
{
  email: string;
}
```

**Response 200 OK:**
```json
{
  "message": "Jeśli konto istnieje, wysłaliśmy link resetujący na podany adres email"
}
```

**Response 404 Not Found:**
```json
{
  "message": "Jeśli konto istnieje, wysłaliśmy link resetujący na podany adres email"
}
```
*(Z powodów bezpieczeństwa zwracamy ten sam komunikat nawet jeśli email nie istnieje)*

**Response 400 Bad Request:**
```json
{
  "message": "Błąd walidacji",
  "errors": [...]
}
```

**Response 429 Too Many Requests:**
```json
{
  "message": "Zbyt wiele prób. Spróbuj ponownie za chwilę."
}
```

**Akcje frontendowe:**
- Wywołanie `fetch("/api/auth/reset-password", { method: "POST", ... })`
- Obsługa odpowiedzi 200: ustawienie `isSuccess: true`, wyświetlenie komunikatu sukcesu
- Obsługa błędów: toast + error message

## 8. Interakcje użytkownika

### Wejście na `/reset-password` jako niezalogowany
- System wyświetla formularz żądania resetu
- Pole: email
- Przycisk "Wyślij link resetujący"
- Link "Powrót do logowania"
- Hint: "Wyślemy Ci link do zresetowania hasła"

### Wejście na `/reset-password` jako zalogowany
- System sprawdza sesję server-side
- Automatyczne przekierowanie do `/dashboard`

### Wypełnianie formularza
- Wprowadzenie email → walidacja on blur (format)
- Błędy wyświetlane inline pod polem
- Przycisk disabled gdy `isSubmitting`

### Submit formularza
- Walidacja client-side
- Jeśli błędy → wyświetlenie error message, brak wywołania API
- Jeśli OK → POST /api/auth/reset-password
- Podczas submitu: przycisk disabled, tekst "Wysyłanie..."

### Sukces wysłania linku
- Przełączenie do stanu "sukces"
- Wyświetlenie karty z:
  - Ikona sukcesu (✓ lub 🎉)
  - Nagłówek: "Sprawdź swoją skrzynkę email"
  - Opis: "Jeśli konto z tym adresem email istnieje, wysłaliśmy link resetujący hasło. Link jest ważny przez 1 godzinę."
  - Przycisk "Powrót do logowania"
- Brak toasta (komunikat już jest w UI)

### Błąd wysłania linku
- Toast: "Wystąpił błąd. Spróbuj ponownie."
- Error message ogólny pod formularzem
- Przycisk aktywny ponownie

### Zbyt wiele prób (429)
- Toast: "Zbyt wiele prób. Spróbuj ponownie za chwilę."
- Error message ogólny pod formularzem
- Przycisk disabled przez 60 sekund lub użytkownik musi odświeżyć stronę

### Kliknięcie "Powrót do logowania"
- Nawigacja do `/login`

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

### Walidacja przed submitem
- Sprawdzenie pola email
- Jeśli błąd → ustawienie w state, brak wywołania API
- Wyświetlenie error message

### Bezpieczeństwo
- Nie ujawniamy czy email istnieje w bazie
- Zawsze zwracamy 200 + komunikat sukcesu
- Backend wysyła email tylko jeśli user istnieje
- Frontend zawsze wyświetla komunikat sukcesu

### Accessibility
- `Label` dla pola email
- `aria-invalid` dla pola z błędem
- `aria-describedby` dla error message
- Focus visible dla wszystkich interaktywnych elementów
- Keyboard navigation

## 10. Obsługa błędów

### 400 Bad Request (Błąd walidacji)
- Toast: "Błąd walidacji"
- Error message: "Nieprawidłowy format email"
- Przycisk aktywny ponownie

### 429 Too Many Requests
- Toast: "Zbyt wiele prób. Spróbuj ponownie za chwilę."
- Error message ogólny
- Przycisk disabled przez 60 sekund

### 500 Internal Server Error
- Toast: "Wystąpił błąd. Spróbuj ponownie."
- Error message ogólny
- Przycisk aktywny ponownie

### Błąd sieci
- Toast: "Brak połączenia. Sprawdź internet."
- Error message ogólny
- Przycisk aktywny ponownie

### Edge cases
- Email nie istnieje w bazie → zawsze sukces (bezpieczeństwo)
- Użytkownik wysyła request wielokrotnie → rate limiting (429)
- Nieprawidłowy format email → client-side validation catch

## 11. Kroki implementacji

1. **Utworzyć stronę `src/pages/reset-password.astro`:**
   - Dodać server-side sprawdzenie sesji
   - Przekierowanie zalogowanych do `/dashboard`
   - Renderowanie `Layout` z `hideHeader={true}`
   - Gradient background

2. **Utworzyć komponent `src/components/auth/ResetPasswordRequestForm.tsx`:**
   - Import Shadcn/ui components
   - Zdefiniować interfejs `ResetPasswordRequestFormState`
   - Zaimplementować `useState` dla stanu formularza (z flagą `isSuccess`)

3. **Zaimplementować funkcje walidacji:**
   - `validateEmail` - sprawdzenie formatu email
   - Walidacja on blur

4. **Zaimplementować `handleSubmit`:**
   - Walidacja client-side przed wysłaniem
   - Wywołanie `fetch("/api/auth/reset-password")`
   - Obsługa odpowiedzi 200: ustawienie `isSuccess: true`
   - Obsługa błędów: toasty + error messages

5. **Zbudować UI formularza (`renderForm`):**
   - Card z CardHeader, CardContent, CardFooter
   - Input dla email z walidacją
   - Hint: "Wyślemy Ci link do zresetowania hasła"
   - Error messages inline
   - Button submit z disabled state
   - Link "Powrót do logowania" w CardFooter

6. **Zbudować UI sukcesu (`renderSuccess`):**
   - Card z CardHeader, CardContent
   - Ikona sukcesu (✓ emoji lub Lucide React icon)
   - Nagłówek: "Sprawdź swoją skrzynkę email"
   - Opis: "Jeśli konto z tym adresem email istnieje, wysłaliśmy link resetujący hasło. Link jest ważny przez 1 godzinę."
   - Button "Powrót do logowania" → `/login`

7. **Dodać conditional rendering:**
   - `{isSuccess ? renderSuccess() : renderForm()}`

8. **Dodać responsywność:**
   - Tailwind classes dla mobile-first
   - `max-w-md` dla desktop
   - `w-full` dla mobile
   - Touch targets min 44x44px

9. **Dodać accessibility:**
   - `Label` dla pola email
   - `aria-invalid` dla pola z błędem
   - `aria-describedby` dla error message
   - Keyboard navigation

10. **Przetestować:**
    - Walidacja email
    - Submit z poprawnym emailem
    - Wyświetlenie komunikatu sukcesu
    - Link powrotu do logowania
    - Rate limiting (429)
    - Responsywność (mobile/desktop)
    - Accessibility (keyboard, screen reader)

11. **Integracja:**
    - Sprawdzić działanie z API endpoint
    - Sprawdzić przełączanie stanów (formularz → sukces)
    - Sprawdzić toast notifications
    - Sprawdzić link do logowania
