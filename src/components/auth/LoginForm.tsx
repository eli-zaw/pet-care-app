import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  redirectUrl?: string; // Domyślnie "/dashboard"
}

export function LoginForm({ redirectUrl = "/dashboard" }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email jest wymagany";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Nieprawidłowy format email";
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return "Hasło jest wymagane";
    return undefined;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setFormData((prev) => ({ ...prev, email: newEmail }));
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handleEmailBlur = () => {
    const error = validateEmail(formData.email);
    if (error) {
      setErrors((prev) => ({ ...prev, email: error }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData((prev) => ({ ...prev, password: newPassword }));
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const handlePasswordBlur = () => {
    const error = validatePassword(formData.password);
    if (error) {
      setErrors((prev) => ({ ...prev, password: error }));
    }
  };

  const validateForm = (): boolean => {
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    const newErrors: typeof errors = {};
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || "Wystąpił błąd podczas logowania" });
        return;
      }

      // Sukces - przekieruj do redirectUrl
      window.location.href = redirectUrl;
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: "Wystąpił błąd podczas logowania" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = formData.email && formData.password;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Logowanie</CardTitle>
        <CardDescription>Zaloguj się do swojego konta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Błąd ogólny */}
          {errors.general && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{errors.general}</div>
          )}

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
              value={formData.email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="text-base md:text-sm"
              placeholder="twój@email.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email}
              </p>
            )}
          </div>

          {/* Pole: Hasło */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Hasło
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                className="text-base md:text-sm pr-10"
                placeholder="Twoje hasło"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password}
              </p>
            )}
          </div>

          {/* Link do resetowania hasła */}
          <div className="text-right">
            <a href="/reset-password" className="text-sm text-primary hover:underline">
              Zapomniałeś hasła?
            </a>
          </div>

          {/* Przycisk submit */}
          <Button type="submit" className="w-full min-h-[44px] sm:min-h-0" disabled={!isValid || isSubmitting}>
            {isSubmitting ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Nie masz konta?{" "}
          <a href="/register" className="text-primary hover:underline">
            Zarejestruj się
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
