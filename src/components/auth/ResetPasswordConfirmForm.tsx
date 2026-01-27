import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface ResetPasswordConfirmFormProps {
  accessToken: string;
}

export function ResetPasswordConfirmForm({ accessToken }: ResetPasswordConfirmFormProps) {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password: string): string | undefined => {
    if (!password) return "Hasło jest wymagane";
    if (password.length < 8) return "Hasło musi mieć minimum 8 znaków";
    return undefined;
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
    if (!confirmPassword) return "Potwierdzenie hasła jest wymagane";
    if (password !== confirmPassword) return "Hasła nie są identyczne";
    return undefined;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData(prev => ({ ...prev, password: newPassword }));
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handlePasswordBlur = () => {
    const error = validatePassword(formData.password);
    if (error) {
      setErrors(prev => ({ ...prev, password: error }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setFormData(prev => ({ ...prev, confirmPassword: newConfirmPassword }));
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleConfirmPasswordBlur = () => {
    const error = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (error) {
      setErrors(prev => ({ ...prev, confirmPassword: error }));
    }
  };

  const validateForm = (): boolean => {
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);

    const newErrors: typeof errors = {};
    if (passwordError) newErrors.password = passwordError;
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

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
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: accessToken,
          newPassword: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || "Nie udało się zmienić hasła" });
        return;
      }

      // Sukces - pokaż komunikat i przekieruj do logowania
      toast.success(data.message || "Hasło zostało zmienione");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000); // Krótkie opóźnienie żeby użytkownik zobaczył toast
    } catch (error) {
      console.error("Reset password confirm error:", error);
      setErrors({ general: "Nie udało się zmienić hasła" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 8;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Ustaw nowe hasło</CardTitle>
        <CardDescription>
          Wprowadź nowe hasło do swojego konta. Link resetujący jest jednorazowy i wygaśnie po użyciu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Błąd ogólny */}
          {errors.general && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errors.general}
            </div>
          )}

          {/* Pole: Nowe hasło */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Nowe hasło
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
                placeholder="Minimum 8 znaków"
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
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Minimum 8 znaków</p>
          </div>

          {/* Pole: Potwierdź hasło */}
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Potwierdź hasło
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleConfirmPasswordChange}
                onBlur={handleConfirmPasswordBlur}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                className="text-base md:text-sm pr-10"
                placeholder="Powtórz nowe hasło"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmitting}
                aria-label={showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-destructive">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Przycisk submit */}
          <Button
            type="submit"
            className="w-full min-h-[44px] sm:min-h-0"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? "Zapisywanie..." : "Zmień hasło"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}