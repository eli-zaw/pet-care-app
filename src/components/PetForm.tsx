import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GetPetResponseDto, SpeciesOption } from "@/types";
import { usePetForm } from "@/components/hooks/usePetForm";

// Stałe opcji gatunków
const SPECIES_OPTIONS: SpeciesOption[] = [
  { value: "dog", label: "Pies", emoji: "🐕" },
  { value: "cat", label: "Kot", emoji: "🐱" },
  { value: "other", label: "Inne", emoji: "🐾" },
];

// Propsy komponentu PetForm
interface PetFormProps {
  mode?: "create" | "edit";
  petId?: string;
  initialData?: GetPetResponseDto;
  onSuccess?: (petId: string) => void;
}

export function PetForm({ mode = "create", petId, initialData, onSuccess }: PetFormProps) {
  const {
    form,
    isUnchanged,
    mode: resolvedMode,
    nameRules,
    speciesRules,
    submitHandler,
  } = usePetForm({
    mode,
    petId,
    initialData,
    onSuccess,
  });
  const {
    control,
    formState: { errors, isSubmitting, isValid },
    register,
  } = form;

  const handleCancel = () => {
    if (mode === "edit" && petId) {
      window.location.href = `/pets/${petId}`;
    } else {
      window.location.href = "/dashboard";
    }
  };

  // Teksty zależne od trybu
  const headerTitle = resolvedMode === "edit" && initialData ? `Edytuj ${initialData.name}` : "Dodaj swojego pupila";
  const headerDescription =
    resolvedMode === "edit"
      ? "Zaktualizuj informacje o swoim zwierzęciu"
      : "Wprowadź podstawowe informacje o swoim zwierzęciu";
  const submitButtonText = resolvedMode === "edit" ? "Zapisz zmiany" : "Zapisz";

  // Sprawdzenie czy przycisk submit powinien być disabled
  const isSubmitDisabled = !isValid || isSubmitting || (resolvedMode === "edit" && isUnchanged);

  return (
    <Card className="mx-auto max-w-2xl" data-testid="pet-form">
      <form onSubmit={submitHandler} data-testid="pet-form-form">
        <CardHeader>
          <CardTitle data-testid="pet-form-title">{headerTitle}</CardTitle>
          <CardDescription data-testid="pet-form-description">{headerDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Błąd ogólny */}
          {errors.root?.message && (
            <div
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              data-testid="pet-form-general-error"
            >
              {errors.root.message}
            </div>
          )}

          {/* Pole: Imię */}
          <div className="space-y-2" data-testid="pet-form-name-field">
            <label
              htmlFor="name"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              data-testid="pet-form-name-label"
            >
              Imię
            </label>
            <Input
              id="name"
              type="text"
              maxLength={50}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              className="text-base md:text-sm"
              placeholder="np. Luna, Max, Reksio"
              data-testid="pet-form-name-input"
              {...register("name", nameRules)}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive" data-testid="pet-form-name-error">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Pole: Gatunek */}
          <div className="space-y-2" data-testid="pet-form-species-field">
            <label
              htmlFor="species"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              data-testid="pet-form-species-label"
            >
              Gatunek
            </label>
            <Controller
              control={control}
              name="species"
              rules={speciesRules}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={resolvedMode === "edit"}
                  data-testid="pet-form-species-select"
                >
                  <SelectTrigger
                    id="species"
                    aria-invalid={!!errors.species}
                    className="text-base md:text-sm"
                    disabled={resolvedMode === "edit"}
                    data-testid="pet-form-species-trigger"
                  >
                    <SelectValue placeholder="Wybierz gatunek" />
                  </SelectTrigger>
                  <SelectContent data-testid="pet-form-species-content">
                    {SPECIES_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        data-testid={`pet-form-species-option-${option.value}`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{option.emoji}</span>
                          <span>{option.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {resolvedMode === "edit" && (
              <p className="text-xs text-muted-foreground" data-testid="pet-form-species-disabled-hint">
                Gatunek nie może być zmieniony po utworzeniu
              </p>
            )}
            {errors.species && (
              <p className="text-sm text-destructive" data-testid="pet-form-species-error">
                {errors.species.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="min-h-[44px] sm:min-h-0"
            data-testid="pet-form-cancel-button"
          >
            Anuluj
          </Button>
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className="min-h-[44px] sm:min-h-0"
            data-testid="pet-form-submit-button"
          >
            {isSubmitting ? "Zapisywanie..." : submitButtonText}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
