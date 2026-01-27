# Plan implementacji widoku: Resetowanie hasła - potwierdzenie nowego hasła

## 1. Przegląd
Widok potwierdzenia nowego hasła umożliwia użytkownikom, którzy kliknęli link resetujący z emaila, ustawienie nowego hasła. Po pomyślnej zmianie hasła użytkownik jest przekierowywany do strony logowania z komunikatem sukcesu.

## 2. Routing widoku
Ścieżka: `/reset-password/confirm` (publiczny, wymaga tokenu)

Parametry URL:
- `?token={reset_token}` - token resetujący z emaila (wymagany)
- `?type=recovery` - typ akcji (Supabase Auth)

Logika:
- Brak tokenu: wyświetlenie błędu i link do `/reset-password`
- Token nieprawidłowy/wygasły: wyświetlenie błędu po submicie
- Token prawidłowy: formularz nowego hasła

## 3. Struktura komponentów
- `ResetPasswordConfirmPage` (Astro page - `reset-password/confirm.astro`)
- `ResetPasswordConfirmForm` (React component - `client:load`)

## 4. Szczegóły komponentów

### `ResetPasswordConfirmPage` (reset-password/confirm.astro)
- Opis komponentu: Strona Astro renderująca formularz potwierdzenia nowego hasła z server-side ekstrakcją tokenu.
- Główne elementy: `Layout` z `hideHeader={true}`, gradient background, `ResetPasswordConfirmForm` component.
- Obsługiwane interakcje: brak (statyczna strona Astro).
- Obsługiwana walidacja: server-side ekstrakcja tokenu z URL.
- Typy: brak specyficznych typów.
- Propsy: brak (top-level page).

**Struktura:**
```astro
---
import Layout from "@/layouts/Layout.astro";
import { ResetPasswordConfirmForm } from "@/components/auth/ResetPasswordConfirmForm";

// Server-side: ekstrakcja tokenu
const token = Astro.url.searchParams.get("token");
const type = Astro.url.searchParams.get("type");

// Jeśli brak tokenu, przekierowanie do /reset-password
if (!token || type !== "recovery") {
  return Astro.redirect("/reset-password");
}
---

<Layout title="Nowe hasło - Pet Care Companion" hideHeader>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
    <ResetPasswordConfirmForm client:load token={token} />
  </div>
</Layout>
```

### `ResetPasswordConfirmForm` (ResetPasswordConfirmForm.tsx)
- Opis komponentu: Formularz ustawiania nowego hasła z walidacją, potwierdzeniem hasła i komunikacją z API.
- Główne elementy:
  - `Card` (Shadcn/ui): kontener formularza
  - `Input` type="password" dla nowego hasła
  - `Input` type="password" dla potwierdzenia hasła
  - `Button` typu submit
  - Inline error messages
  - Hint: "Minimum 8 znaków"
- Obsługiwane interakcje:
  - Walidacja on blur dla obu pól hasła
  - Submit formularza → PATCH /api/auth/reset-password/confirm
  - Po sukcesie → redirect do /login z toast
- Obsługiwana walidacja:
  - Nowe hasło: wymagane, minimum 8 znaków
  - Potwierdzenie hasła: wymagane, musi być identyczne z nowym hasłem
- Typy: `ResetPasswordConfirmFormState`, `ResetPasswordConfirmFormProps`
- Propsy: `token: string` (z Astro page)

**Interfejs props:**
```typescript
interface ResetPasswordConfirmFormProps {
  token: string;
}
```

**Interfejs stanu:**
```typescript
interface ResetPasswordConfirmFormState {
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  errors: {
    password?: string;
    confirmPassword?: string;
    general?: string;
  };
}
```

**Kluczowe funkcje:**
- `validatePassword(password: string): string | undefined` - sprawdza długość
- `validateConfirmPassword(password: string, confirmPassword: string): string | undefined` - sprawdza zgodność
- `handleSubmit(e: FormEvent): Promise<void>`

## 5. Typy
Typy definiowane lokalnie w komponencie:
- `ResetPasswordConfirmFormProps`
- `ResetPasswordConfirmFormState`

## 6. Zarządzanie stanem
Stan lokalny w komponencie `ResetPasswordConfirmForm`:
- `formState: ResetPasswordConfirmFormState` - zawiera password, confirmPassword, isSubmitting, errors
- `useState` dla zarządzania stanem formularza
- Props `token` przekazywany z Astro page

## 7. Integracja API

### Endpoint: PATCH /api/auth/reset-password/confirm
**Request:**
```typescript
{
  token: string;
  password: string;
}
```

**Response 200 OK:**
```json
{
  "message": "Hasło zostało zmienione"
}
```

**Response 400 Bad Request (walidacja):**
```json
{
  "message": "Hasło musi mieć minimum 8 znaków"
}
```

**Response 400 Bad Request (token):**
```json
{
  "message": "Link resetujący wygasł lub jest nieprawidłowy"
}
```

**Response 500 Internal Server Error:**
```json
{
  "message": "Wystąpił błąd podczas zmiany hasła"
}
```

**Akcje frontendowe:**
- Wywołanie `fetch("/api/auth/reset-password/confirm", { method: "PATCH", body: { token, password } })`
- Obsługa odpowiedzi 200: toast "Hasło zostało zmienione" + redirect `/login`
- Obsługa błędów: toast + error message

## 8. Interakcje użytkownika

### Wejście na `/reset-password/confirm?token=xxx&type=recovery`
- System wyświetla formularz nowego hasła
- Pola: nowe hasło, potwierdzenie hasła
- Hint: "Minimum 8 znaków"
- Przycisk "Zmień hasło"

### Wejście na `/reset-password/confirm` (bez tokenu)
- System sprawdza brak tokenu server-side
- Automatyczne przekierowanie do `/reset-password`

### Wypełnianie formularza
- Wprowadzenie nowego hasła → walidacja on blur (długość)
- Wprowadzenie potwierdzenia hasła → walidacja on blur (zgodność)
- Błędy wyświetlane inline pod polami
- Przycisk disabled gdy `isSubmitting`

### Submit formularza
- Walidacja client-side
- Sprawdzenie długości hasła
- Sprawdzenie zgodności haseł
- Jeśli błędy → wyświetlenie error messages, brak wywołania API
- Jeśli OK → PATCH /api/auth/reset-password/confirm
- Podczas submitu: przycisk disabled, tekst "Zmienianie hasła..."

### Sukces zmiany hasła
- Toast: "Hasło zostało zmienione" (zielony, 3s)
- Automatyczne przekierowanie do `/login`
- Użytkownik musi się zalogować nowym hasłem
- **Uwaga:** Po zmianie hasła wszystkie aktywne sesje użytkownika pozostają aktywne (uproszczenie dla MVP, zgodnie z US-017)

### Błąd zmiany hasła
- Token wygasł/nieprawidłowy:
  - Toast: "Link resetujący wygasł lub jest nieprawidłowy"
  - Error message: "Link resetujący wygasł. Wróć do formularza i wyślij nowy link."
  - Link: "Wyślij nowy link" → `/reset-password`
- Inne błędy:
  - Toast: "Wystąpił błąd podczas zmiany hasła"
  - Error message ogólny
  - Przycisk aktywny ponownie

### Responsywność
- Desktop (≥768px): Card max-w-md, centered
- Mobile (<768px): Card pełna szerokość, przyciski pełna szerokość min 44x44px

## 9. Warunki i walidacja

### Walidacja nowego hasła
- Wymagane: nie może być puste
- Długość: minimum 8 znaków
- Walidacja on blur
- Error message: "Hasło jest wymagane" lub "Hasło musi mieć minimum 8 znaków"
- Hint pod polem: "Minimum 8 znaków"

### Walidacja potwierdzenia hasła
- Wymagane: nie może być puste
- Zgodność: musi być identyczne z nowym hasłem
- Walidacja on blur
- Error message: "Potwierdzenie hasła jest wymagane" lub "Hasła nie są identyczne"

### Walidacja przed submitem
- Sprawdzenie obu pól
- Sprawdzenie długości nowego hasła
- Sprawdzenie zgodności haseł
- Jeśli błędy → ustawienie w state, brak wywołania API
- Wyświetlenie error messages

### Accessibility
- `Label` dla każdego pola
- `type="password"` dla obu inputów
- `aria-invalid` dla pól z błędami
- `aria-describedby` dla error messages
- Focus visible dla wszystkich interaktywnych elementów
- Keyboard navigation

## 10. Obsługa błędów

### 400 Bad Request (walidacja hasła)
- Toast: "Hasło musi mieć minimum 8 znaków"
- Error message przy polu hasła
- Przycisk aktywny ponownie

### 400 Bad Request (token wygasły/nieprawidłowy)
- Toast: "Link resetujący wygasł lub jest nieprawidłowy"
- Error message: "Link resetujący wygasł. Wróć do formularza i wyślij nowy link."
- Link "Wyślij nowy link" → `/reset-password`
- Wyłączenie formularza (disabled)

### 500 Internal Server Error
- Toast: "Wystąpił błąd podczas zmiany hasła"
- Error message ogólny
- Przycisk aktywny ponownie

### Błąd sieci
- Toast: "Brak połączenia. Sprawdź internet."
- Error message ogólny
- Przycisk aktywny ponownie

### Edge cases
- Token wygasł (>1h) → 400 + komunikat o wygaśnięciu
- Token już wykorzystany → 400 + komunikat o wygaśnięciu
- Użytkownik wpisuje za krótkie hasło → client-side validation catch
- Hasła nie są identyczne → client-side validation catch
- Brak tokenu w URL → server-side redirect do `/reset-password`

## 11. Kroki implementacji

1. **Utworzyć folder i stronę `src/pages/reset-password/confirm.astro`:**
   - Dodać ekstrakcję parametrów `token` i `type` z URL
   - Sprawdzenie obecności tokenu i typu "recovery"
   - Przekierowanie do `/reset-password` jeśli brak tokenu
   - Renderowanie `Layout` z `hideHeader={true}`
   - Gradient background

2. **Utworzyć komponent `src/components/auth/ResetPasswordConfirmForm.tsx`:**
   - Import Shadcn/ui components
   - Zdefiniować interfejsy `ResetPasswordConfirmFormProps` i `ResetPasswordConfirmFormState`
   - Zaimplementować `useState` dla stanu formularza
   - Odebranie `token` jako prop

3. **Zaimplementować funkcje walidacji:**
   - `validatePassword` - sprawdzenie długości (min 8)
   - `validateConfirmPassword` - sprawdzenie zgodności z `password`
   - Walidacja on blur dla każdego pola

4. **Zaimplementować `handleSubmit`:**
   - Walidacja client-side przed wysłaniem
   - Wywołanie `fetch("/api/auth/reset-password/confirm", { method: "PATCH", body: { token, password } })`
   - Obsługa odpowiedzi 200: toast "Hasło zostało zmienione" + redirect `/login`
   - Obsługa błędów 400 (token): toast + error message + link do `/reset-password`
   - Obsługa innych błędów: toast + error message

5. **Zbudować UI formularza:**
   - Card z CardHeader, CardContent, CardFooter
   - Input type="password" dla nowego hasła z walidacją
   - Hint: "Minimum 8 znaków"
   - Input type="password" dla potwierdzenia hasła z walidacją
   - Error messages inline
   - Button submit z disabled state
   - Conditional link "Wyślij nowy link" (tylko przy błędzie tokenu)

6. **Dodać responsywność:**
   - Tailwind classes dla mobile-first
   - `max-w-md` dla desktop
   - `w-full` dla mobile
   - Touch targets min 44x44px

7. **Dodać accessibility:**
   - `Label` dla każdego pola
   - `type="password"` dla inputów
   - `aria-invalid` dla pól z błędami
   - `aria-describedby` dla error messages
   - Keyboard navigation

8. **Przetestować:**
   - Walidacja nowego hasła (długość)
   - Walidacja potwierdzenia hasła (zgodność)
   - Submit z poprawnymi danymi
   - Submit z tokenem wygasłym/nieprawidłowym
   - Przekierowanie do `/login` po sukcesie
   - Toast notifications
   - Responsywność (mobile/desktop)
   - Accessibility (keyboard, screen reader)

9. **Integracja:**
   - Sprawdzić działanie z API endpoint
   - Sprawdzić przekierowanie do `/login` z toastem
   - Sprawdzić link "Wyślij nowy link"
   - Sprawdzić redirect przy braku tokenu
   - Przetestować cały flow reset hasła (request → email → confirm)
