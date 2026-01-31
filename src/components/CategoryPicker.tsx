import { Button } from "@/components/ui/button";
import type { CareCategoryOption, CareCategoryType } from "@/types";

// Stałe opcji kategorii
export const CARE_CATEGORY_OPTIONS: CareCategoryOption[] = [
  { value: "vet_visit", label: "Wizyta u weterynarza", emoji: "🏥" },
  { value: "medication", label: "Leki i suplementy", emoji: "💊" },
  { value: "grooming", label: "Groomer", emoji: "✂️" },
  { value: "food", label: "Karma", emoji: "🍖" },
  { value: "health_event", label: "Zdarzenie zdrowotne", emoji: "🩹" },
  { value: "note", label: "Notatka", emoji: "📝" },
];

interface CategoryPickerProps {
  value: CareCategoryType | null;
  onChange: (category: CareCategoryType) => void;
  error?: string;
}

export function CategoryPicker({ value, onChange, error }: CategoryPickerProps) {
  return (
    <div className="space-y-2">
      {/* Grid 2x3 (mobile: 2 kolumny, desktop: 3 kolumny) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {CARE_CATEGORY_OPTIONS.map((option) => {
          const isSelected = value === option.value;

          return (
            <Button
              key={option.value}
              type="button"
              variant={isSelected ? "default" : "outline"}
              onClick={() => onChange(option.value)}
              className="h-auto min-h-[88px] flex-col gap-2 p-4 text-center"
              aria-pressed={isSelected}
            >
              <span className="text-3xl" aria-hidden="true">
                {option.emoji}
              </span>
              <span className="text-sm font-medium leading-tight">{option.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Błąd walidacji */}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
