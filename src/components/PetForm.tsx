import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CreatePetCommand,
  CreatePetResponseDto,
  GetPetResponseDto,
  PetFormErrors,
  PetFormViewModel,
  SpeciesOption,
  SpeciesType,
  UpdatePetCommand,
} from "@/types";

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

export function PetForm({
  mode = "create",
  petId,
  initialData,
  onSuccess,
}: PetFormProps) {
  // Stan formularza - inicjalizacja z initialData w trybie edit
  const [formData, setFormData] = useState<PetFormViewModel>(() => {
    if (mode === "edit" && initialData) {
      return {
        name: initialData.name,
        species: initialData.species,
      };
    }
    return {
      name: "",
      species: "",
    };
  });

  // Stan do śledzenia początkowej wartości imienia (dla isUnchanged)
  const [initialName] = useState<string>(
    mode === "edit" && initialData ? initialData.name : ""
  );

  const [errors, setErrors] = useState<PetFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Autofokus na pole imienia przy montowaniu
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Computed value: sprawdzenie czy formularz jest poprawny
  const isValid = useMemo(() => {
    const trimmedName = formData.name.trim();
    const hasValidName = trimmedName.length > 0 && trimmedName.length <= 50;
    const hasValidSpecies = formData.species !== "";
    return hasValidName && hasValidSpecies;
  }, [formData.name, formData.species]);

  // Computed value: sprawdzenie czy dane się zmieniły (tylko w trybie edit)
  const isUnchanged = useMemo(() => {
    if (mode !== "edit") return false;
    return formData.name.trim() === initialName;
  }, [mode, formData.name, initialName]);

  // Walidacja imienia
  const validateName = (name: string): string | undefined => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return "Imię jest wymagane";
    }
    if (trimmedName.length > 50) {
      return "Imię może mieć maksymalnie 50 znaków";
    }
    return undefined;
  };

  // Handler zmiany imienia
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData((prev) => ({ ...prev, name: newName }));
    // Czyszczenie błędu podczas wpisywania
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  // Handler blur na polu imienia
  const handleNameBlur = () => {
    const error = validateName(formData.name);
    if (error) {
      setErrors((prev) => ({ ...prev, name: error }));
    }
  };

  // Handler zmiany gatunku
  const handleSpeciesChange = (value: string) => {
    setFormData((prev) => ({ ...prev, species: value as SpeciesType }));
    // Czyszczenie błędu gatunku
    if (errors.species) {
      setErrors((prev) => ({ ...prev, species: undefined }));
    }
  };

  // Walidacja całego formularza
  const validateForm = (): boolean => {
    const newErrors: PetFormErrors = {};

    const nameError = validateName(formData.name);
    if (nameError) {
      newErrors.name = nameError;
    }

    // W trybie edit gatunek jest disabled, więc nie walidujemy
    if (mode === "create" && formData.species === "") {
      newErrors.species = "Gatunek jest wymagany";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Obsługa błędów API
  const handleApiError = (
    status: number,
    data: { error?: string; message?: string }
  ) => {
    switch (status) {
      case 400:
        // Błąd walidacji
        toast.error("Sprawdź poprawność danych");
        if (data.message) {
          setErrors((prev) => ({ ...prev, general: data.message }));
        }
        break;
      case 401:
        // Brak sesji
        toast.error("Sesja wygasła");
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
        break;
      case 403:
        // Brak dostępu (tylko w trybie edit)
        toast.error("Brak dostępu do tego zwierzęcia");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
        break;
      case 404:
        // Zwierzę nie znalezione (tylko w trybie edit)
        toast.error("Zwierzę nie znalezione");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
        break;
      case 409:
        // Konflikt nazwy
        toast.error("Zwierzę o tej nazwie już istnieje");
        setErrors((prev) => ({
          ...prev,
          name: "Zwierzę o tej nazwie już istnieje",
        }));
        break;
      case 500:
        // Błąd serwera
        toast.error("Coś poszło nie tak. Spróbuj ponownie.");
        break;
      default:
        toast.error("Wystąpił nieoczekiwany błąd");
    }
  };

  // Handler submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Walidacja przed wysłaniem
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (mode === "create") {
        // Tryb CREATE: POST /api/pets
        const command: CreatePetCommand = {
          name: formData.name.trim(),
          species: formData.species as SpeciesType,
        };

        const response = await fetch("/api/pets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          handleApiError(response.status, errorData);
          setIsSubmitting(false);
          return;
        }

        const result: CreatePetResponseDto = await response.json();

        // Sukces
        toast.success("Zwierzę zostało dodane");

        // Callback jeśli podany
        if (onSuccess) {
          onSuccess(result.id);
        } else {
          // Domyślne przekierowanie do profilu nowo utworzonego zwierzęcia
          window.location.href = `/pets/${result.id}`;
        }
      } else {
        // Tryb EDIT: PATCH /api/pets/:petId
        if (!petId) {
          console.error("PetForm: petId is required in edit mode");
          toast.error("Wystąpił błąd");
          setIsSubmitting(false);
          return;
        }

        const command: UpdatePetCommand = {
          name: formData.name.trim(),
        };

        const response = await fetch(`/api/pets/${petId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          handleApiError(response.status, errorData);
          setIsSubmitting(false);
          return;
        }

        const result: GetPetResponseDto = await response.json();

        // Sukces
        toast.success("Zmiany zostały zapisane");

        // Callback jeśli podany
        if (onSuccess) {
          onSuccess(result.id);
        } else {
          // Domyślne przekierowanie do profilu zwierzęcia
          window.location.href = `/pets/${result.id}`;
        }
      }
    } catch (error) {
      // Błąd sieci
      console.error("Network error in PetForm:", error);
      if (error instanceof TypeError) {
        toast.error("Brak połączenia. Sprawdź internet.");
      } else {
        toast.error("Wystąpił nieoczekiwany błąd");
      }
      setIsSubmitting(false);
    }
  };

  // Handler anulowania
  const handleCancel = () => {
    if (mode === "edit" && petId) {
      window.location.href = `/pets/${petId}`;
    } else {
      window.location.href = "/dashboard";
    }
  };

  // Teksty zależne od trybu
  const headerTitle =
    mode === "edit" && initialData
      ? `Edytuj ${initialData.name}`
      : "Dodaj swojego pupila";
  const headerDescription =
    mode === "edit"
      ? "Zaktualizuj informacje o swoim zwierzęciu"
      : "Wprowadź podstawowe informacje o swoim zwierzęciu";
  const submitButtonText = mode === "edit" ? "Zapisz zmiany" : "Zapisz";

  // Sprawdzenie czy przycisk submit powinien być disabled
  const isSubmitDisabled =
    !isValid || isSubmitting || (mode === "edit" && isUnchanged);

  return (
    <Card className="mx-auto max-w-2xl">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{headerTitle}</CardTitle>
          <CardDescription>{headerDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Błąd ogólny */}
          {errors.general && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errors.general}
            </div>
          )}

          {/* Pole: Imię */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Imię
            </label>
            <Input
              id="name"
              ref={nameInputRef}
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              maxLength={50}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              className="text-base md:text-sm"
              placeholder="np. Luna, Max, Reksio"
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          {/* Pole: Gatunek */}
          <div className="space-y-2">
            <label
              htmlFor="species"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Gatunek
            </label>
            <Select
              value={formData.species}
              onValueChange={handleSpeciesChange}
              disabled={mode === "edit"}
            >
              <SelectTrigger
                id="species"
                aria-invalid={!!errors.species}
                className="text-base md:text-sm"
                disabled={mode === "edit"}
              >
                <SelectValue placeholder="Wybierz gatunek" />
              </SelectTrigger>
              <SelectContent>
                {SPECIES_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span>{option.emoji}</span>
                      <span>{option.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mode === "edit" && (
              <p className="text-xs text-muted-foreground">
                Gatunek nie może być zmieniony po utworzeniu
              </p>
            )}
            {errors.species && (
              <p className="text-sm text-destructive">{errors.species}</p>
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
          >
            Anuluj
          </Button>
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className="min-h-[44px] sm:min-h-0"
          >
            {isSubmitting ? "Zapisywanie..." : submitButtonText}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
