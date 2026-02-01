# Plan implementacji widoku: Rejestracja

## 1. Przegląd

Widok rejestracji umożliwia nowym użytkownikom utworzenie konta w aplikacji Pet Care Companion. Po pomyślnej rejestracji użytkownik jest automatycznie logowany i przekierowywany do dashboardu.

## 2. Routing widoku

Ścieżka: `/register` (publiczny, tylko dla niezalogowanych)

Logika przekierowania:

- Użytkownik niezalogowany: wyświetla formularz rejestracji
- Użytkownik zalogowany: automatyczne przekierowanie do `/dashboard`

## 3. Struktura komponentów

- `RegisterPage` (Astro page - `register.astro`)
- `RegisterForm` (React component - `client:load`)

## 4. Szczegóły komponentów

### `RegisterPage` (register.astro)

- Opis komponentu: Strona Astro renderująca formularz rejestracji z server-side sprawdzeniem sesji.
- Główne elementy: `Layout` z `hideHeader={true}`, gradient background, `RegisterForm` component.
- Obsługiwane interakcje: brak (statyczna strona Astro).
- Obsługiwana walidacja: server-side sprawdzenie sesji przez `Astro.locals.supabase.auth.getSession()`.
- Typy: brak specyficznych typów.
- Propsy: brak (top-level page).

**Struktura:**

```astro
---
import Layout from "@/layouts/Layout.astro";
import { RegisterForm } from "@/components/auth/RegisterForm";

// Server-side: sprawdzenie sesji
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();
if (session?.user) {
  return Astro.redirect("/dashboard");
}
---

<Layout title="Rejestracja - Pet Care Companion" hideHeader>
  <div
    class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900"
  >
    <RegisterForm client:load />
  </div>
</Layout>
```

### `RegisterForm` (RegisterForm.tsx)

- Opis komponentu: Formularz rejestracji z walidacją client-side, komunikacją z API i obsługą błędów.
- Główne elementy:
  - `Card` (Shadcn/ui): kontener formularza
  - `Input` dla email i hasła
  - `Button` typu submit
  - Inline error messages
  - Link do logowania
- Obsługiwane interakcje:
  - Walidacja on blur dla email i hasła
  - Submit formularza → POST /api/auth/register
  - Kliknięcie linku → nawigacja do /login
- Obsługiwana walidacja:
  - Email: wymagany, format email (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
  - Hasło: wymagane, minimum 8 znaków
  - Walidacja on blur dla każdego pola
- Typy: `RegisterFormState`, `RegisterFormErrors` (do zdefiniowania w komponencie)
- Propsy: brak

**Interfejs stanu:**

```typescript
interface RegisterFormState {
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
- `validatePassword(password: string): string | undefined`
- `handleSubmit(e: FormEvent): Promise<void>`

## 5. Typy

Typy definiowane lokalnie w komponencie (brak globalnych typów wymaganych).

## 6. Zarządzanie stanem

Stan lokalny w komponencie `RegisterForm`:

- `formState: RegisterFormState` - zawiera email, password, isSubmitting, errors
- `useState` dla zarządzania stanem formularza
- Brak custom hooks (prosta forma)

## 7. Integracja API

### Endpoint: POST /api/auth/register

**Request:**

```typescript
{
  email: string;
  password: string;
}
```

**Response 201 Created:**

```json
{
  "message": "Rejestracja zakończona sukcesem",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Response 409 Conflict:**

```json
{
  "message": "Ten email jest już zarejestrowany"
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

- Wywołanie `fetch("/api/auth/register", { method: "POST", ... })`
- Obsługa odpowiedzi 201: toast sukcesu + redirect `/dashboard`
- Obsługa błędów: wyświetlenie toasta i error message

## 8. Interakcje użytkownika

### Wejście na `/register` jako niezalogowany

- System wyświetla formularz rejestracji
- Pola: email, hasło
- Przycisk "Zarejestruj się"
- Link "Masz już konto? Zaloguj się"

### Wejście na `/register` jako zalogowany

- System sprawdza sesję server-side
- Automatyczne przekierowanie do `/dashboard`

### Wypełnianie formularza

- Wprowadzenie email → walidacja on blur
- Wprowadzenie hasła → walidacja on blur
- Błędy wyświetlane inline pod polami
- Przycisk disabled gdy `isSubmitting`

### Submit formularza

- Walidacja client-side
- Jeśli błędy → wyświetlenie error messages, brak wywołania API
- Jeśli OK → POST /api/auth/register
- Podczas submitu: przycisk disabled, tekst "Rejestracja..."

### Sukces rejestracji

- Toast sukcesu: "Witaj w Pet Care Companion" (zielony, 3s)
- Automatyczne przekierowanie do `/dashboard`
- Użytkownik zalogowany (sesja utworzona przez API)

### Błąd rejestracji

- Toast błędu z komunikatem
- Error message pod formularzem lub przy polu email (409)
- Przycisk aktywny ponownie

### Kliknięcie "Masz już konto? Zaloguj się"

- Nawigacja do `/login`

### Responsywność

- Desktop (≥768px): Card max-w-md, centered, normalne przyciski
- Mobile (<768px): Card pełna szerokość z paddingiem, przyciski pełna szerokość min 44x44px, stack layout

## 9. Warunki i walidacja

### Walidacja email

- Wymagany: nie może być pusty
- Format: musi zawierać @ i domenę
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Walidacja on blur
- Error message: "Email jest wymagany" lub "Nieprawidłowy format email"

### Walidacja hasła

- Wymagane: nie może być puste
- Długość: minimum 8 znaków
- Walidacja on blur
- Error message: "Hasło jest wymagane" lub "Hasło musi mieć minimum 8 znaków"
- Hint pod polem: "Minimum 8 znaków"

### Walidacja przed submitem

- Sprawdzenie obu pól
- Jeśli błędy → ustawienie w state, brak wywołania API
- Wyświetlenie wszystkich error messages

### Accessibility

- `Label` dla każdego pola (email, password)
- `aria-invalid` dla pól z błędami
- `aria-describedby` dla powiązania błędów z polami
- Error messages z odpowiednim `id` referencjonowanym przez `aria-describedby`
- Focus visible dla wszystkich interaktywnych elementów

## 10. Obsługa błędów

### 400 Bad Request (Błąd walidacji)

- Toast: "Błąd walidacji"
- Wyświetlenie szczegółowych błędów przy polach
- Przycisk aktywny ponownie

### 409 Conflict (Email już istnieje)

- Toast: "Ten email jest już zarejestrowany"
- Error message przy polu email
- Przycisk aktywny ponownie
- Fokus na polu email

### 500 Internal Server Error

- Toast: "Wystąpił błąd podczas rejestracji"
- Error message ogólny pod formularzem
- Przycisk aktywny ponownie

### Błąd sieci

- Toast: "Brak połączenia. Sprawdź internet."
- Error message ogólny
- Przycisk aktywny ponownie

### Edge cases

- Użytkownik próbuje zarejestrować się na już istniejący email → 409 + odpowiedni komunikat
- Użytkownik wpisuje nieprawidłowy format email → client-side validation catch
- Użytkownik wpisuje za krótkie hasło → client-side validation catch

## 11. Kroki implementacji

1. **Utworzyć stronę `src/pages/register.astro`:**
   - Dodać server-side sprawdzenie sesji
   - Przekierowanie zalogowanych do `/dashboard`
   - Renderowanie `Layout` z `hideHeader={true}`
   - Gradient background zgodny z landing page

2. **Utworzyć komponent `src/components/auth/RegisterForm.tsx`:**
   - Import Shadcn/ui components (Card, Input, Button, Label)
   - Zdefiniować interfejs `RegisterFormState`
   - Zaimplementować `useState` dla stanu formularza

3. **Zaimplementować funkcje walidacji:**
   - `validateEmail` - sprawdzenie formatu email
   - `validatePassword` - sprawdzenie długości hasła
   - Walidacja on blur dla każdego pola

4. **Zaimplementować `handleSubmit`:**
   - Walidacja client-side przed wysłaniem
   - Wywołanie `fetch("/api/auth/register")`
   - Obsługa odpowiedzi 201: toast + redirect
   - Obsługa błędów: toasty + error messages

5. **Zbudować UI formularza:**
   - Card z CardHeader, CardContent, CardFooter
   - Input dla email z walidacją
   - Input dla hasła z walidacją
   - Error messages inline
   - Button submit z disabled state
   - Link do logowania w CardFooter

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
   - Walidacja email (format, wymagane)
   - Walidacja hasła (długość, wymagane)
   - Submit z poprawnymi danymi
   - Submit z email już istniejącym
   - Responsywność (mobile/desktop)
   - Accessibility (keyboard, screen reader)

9. **Integracja:**
   - Sprawdzić działanie z API endpoint
   - Sprawdzić przekierowanie do `/dashboard`
   - Sprawdzić toast notifications
   - Sprawdzić link do logowania
