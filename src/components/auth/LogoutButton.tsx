import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Logout failed:", data.error);
        toast.error("Nie udało się wylogować");
        setIsLoading(false);
        return;
      }

      // Success - redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Nie udało się wylogować");
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      disabled={isLoading}
      className="min-h-[44px] sm:min-h-0"
      aria-label={isLoading ? "Wylogowywanie..." : "Wyloguj się z aplikacji"}
    >
      <LogOut className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">
        {isLoading ? "Wylogowywanie..." : "Wyloguj"}
      </span>
    </Button>
  );
}