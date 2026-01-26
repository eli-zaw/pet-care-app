import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FABProps {
  petId: string;
  label?: string;
}

export function FAB({ petId, label = "Dodaj wpis" }: FABProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Sprawdzenie czy mobile
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Na mobile zawsze widoczny
      if (mobile) {
        setIsVisible(true);
      }
    };

    // Obsługa scroll - pokazuj FAB na desktop po scrollu
    const handleScroll = () => {
      const mobile = window.innerWidth < 768;
      
      if (mobile) {
        // Na mobile zawsze widoczny
        setIsVisible(true);
      } else {
        // Na desktop pokazuj po scrollu > 200px
        setIsVisible(window.scrollY > 200);
      }
    };

    // Inicjalizacja
    checkMobile();
    handleScroll();

    // Listeners
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const handleClick = () => {
    window.location.href = `/pets/${petId}/entries/new`;
  };

  return (
    <Button
      onClick={handleClick}
      size="lg"
      className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-all duration-300 sm:h-auto sm:w-auto sm:rounded-md sm:px-6 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
      }`}
      aria-label={label}
      aria-hidden={!isVisible}
    >
      <Plus className="h-6 w-6 sm:mr-2" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
