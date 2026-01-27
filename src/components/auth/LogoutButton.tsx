import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      // Placeholder for API call - backend not implemented yet
      console.log("Logout attempt");

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Placeholder success - in real implementation would handle response
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      alert("Nie udało się wylogować");
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      disabled={isLoading}
      className="min-h-[44px] sm:min-h-0"
    >
      <LogOut className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">
        {isLoading ? "Wylogowywanie..." : "Wyloguj"}
      </span>
    </Button>
  );
}