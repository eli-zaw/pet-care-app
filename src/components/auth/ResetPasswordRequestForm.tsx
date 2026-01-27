import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function ResetPasswordRequestForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email jest wymagany";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Nieprawidłowy format email";
    return undefined;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (error) {
      setError(undefined);
    }
  };

  const handleEmailBlur = () => {
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Wystąpił błąd podczas wysyłania linku resetującego");
        return;
      }

      // Zawsze pokazuj sukces (bezpieczeństwo - nie ujawniaj czy email istnieje)
      toast.success(data.message || "Jeśli konto istnieje, wysłaliśmy link resetujący na podany adres email");
      setIsSuccess(true);
    } catch (error) {
      console.error("Reset password request error:", error);
      // Nawet w przypadku błędu, pokazuj sukces dla bezpieczeństwa
      toast.success("Jeśli konto istnieje, wysłaliśmy link resetujący na podany adres email");
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    window.location.href = "/login";
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sprawdź swoją skrzynkę email</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Jeśli konto z tym adresem email istnieje, wysłaliśmy link resetujący hasło. Link jest ważny przez 1 godzinę.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Nie otrzymałeś emaila? Sprawdź folder spam lub spróbuj ponownie.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleBackToLogin} variant="outline" className="min-h-[44px] sm:min-h-0">
            Wróć do logowania
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const isValid = email && !error;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Resetowanie hasła</CardTitle>
        <CardDescription>Podaj adres email przypisany do Twojego konta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Błąd */}
          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          {/* Pole: Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              aria-invalid={!!error}
              aria-describedby={error ? "email-error" : undefined}
              className="text-base md:text-sm"
              placeholder="twój@email.com"
              disabled={isSubmitting}
            />
            {error && (
              <p id="email-error" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          {/* Przycisk submit */}
          <Button type="submit" className="w-full min-h-[44px] sm:min-h-0" disabled={!isValid || isSubmitting}>
            {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <a href="/login" className="text-sm text-muted-foreground hover:underline">
          Wróć do logowania
        </a>
      </CardFooter>
    </Card>
  );
}
