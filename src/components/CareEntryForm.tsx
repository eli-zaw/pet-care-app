import { useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CategoryPicker } from "@/components/CategoryPicker";
import { cn } from "@/lib/utils";
import type {
  CareCategoryType,
  CareEntryDto,
  CareEntryFormErrors,
  CareEntryFormViewModel,
  CreateCareEntryCommand,
  UpdateCareEntryCommand,
} from "@/types";

interface CareEntryFormProps {
  mode?: "create" | "edit";
  petId: string;
  petName: string;
  entryId?: string;
  initialData?: CareEntryDto;
  onSuccess?: () => void;
}

export function CareEntryForm({
  mode = "create",
  petId,
  petName,
  entryId,
  initialData,
  onSuccess,
}: CareEntryFormProps) {
  // Inicjalizacja stanu z initialData w trybie edit
  const getInitialFormData = (): CareEntryFormViewModel => {
    if (mode === "edit" && initialData) {
      return {
        category: initialData.category,
        entryDate: new Date(initialData.entry_date),
        note: initialData.note || "",
      };
    }
    return {
      category: null,
      entryDate: new Date(),
      note: "",
    };
  };

  // Stan formularza
  const [formData, setFormData] = useState<CareEntryFormViewModel>(getInitialFormData);

  // Stan początkowy do porównania (tylko w trybie edit)
  const [initialFormData] = useState<CareEntryFormViewModel>(getInitialFormData);

  const [errors, setErrors] = useState<CareEntryFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Computed value: czy formularz jest poprawny
  const isValid = useMemo(() => {
    return formData.category !== null;
  }, [formData.category]);

  // Computed value: czy dane się zmieniły (tylko w trybie edit)
  const isUnchanged = useMemo(() => {
    if (mode !== "edit") return false;

    return (
      formData.category === initialFormData.category &&
      formData.entryDate.toISOString().split("T")[0] === initialFormData.entryDate.toISOString().split("T")[0] &&
      formData.note.trim() === initialFormData.note.trim()
    );
  }, [mode, formData, initialFormData]);

  // Konwersja Date -> YYYY-MM-DD
  const formatDateForApi = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  // Handler zmiany kategorii
  const handleCategoryChange = (category: CareCategoryType) => {
    setFormData((prev) => ({ ...prev, category }));
    // Czyszczenie błędu kategorii
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: undefined }));
    }
  };

  // Handler zmiany daty
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, entryDate: date }));
      setIsCalendarOpen(false);
      // Czyszczenie błędu daty
      if (errors.entryDate) {
        setErrors((prev) => ({ ...prev, entryDate: undefined }));
      }
    }
  };

  // Handler zmiany notatki
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNote = e.target.value;
    setFormData((prev) => ({ ...prev, note: newNote }));
    // Czyszczenie błędu notatki
    if (errors.note) {
      setErrors((prev) => ({ ...prev, note: undefined }));
    }
  };

  // Walidacja formularza
  const validateForm = (): boolean => {
    const newErrors: CareEntryFormErrors = {};

    if (formData.category === null) {
      newErrors.category = "Wybierz kategorię";
    }

    if (formData.note.length > 1000) {
      newErrors.note = "Notatka może mieć maksymalnie 1000 znaków";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Obsługa błędów API
  const handleApiError = (status: number, data: { error?: string; message?: string }) => {
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
      case 403: {
        // Brak dostępu
        const accessMessage = mode === "edit" ? "Brak dostępu do tego wpisu" : "Brak dostępu do tego zwierzęcia";
        toast.error(accessMessage);
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
        break;
      }
      case 404: {
        // Nie znaleziono
        const notFoundMessage = mode === "edit" ? "Wpis nie znaleziony" : "Zwierzę nie znalezione";
        toast.error(notFoundMessage);
        setTimeout(() => {
          const redirectUrl = mode === "edit" ? `/pets/${petId}` : "/dashboard";
          window.location.href = redirectUrl;
        }, 1000);
        break;
      }
      case 500:
        // Błąd serwera
        toast.error("Coś poszło nie tak. Spróbuj ponownie.");
        break;
      default:
        toast.error("Wystąpił nieoczekiwany błąd");
    }
  };

  // Funkcja do budowania partial update (tylko zmienione pola)
  const buildPartialUpdate = (): Partial<UpdateCareEntryCommand> => {
    const updates: Partial<UpdateCareEntryCommand> = {};

    if (formData.category !== initialFormData.category) {
      updates.category = formData.category as CareCategoryType;
    }

    const newDateStr = formatDateForApi(formData.entryDate);
    const initialDateStr = formatDateForApi(initialFormData.entryDate);
    if (newDateStr !== initialDateStr) {
      updates.entry_date = newDateStr;
    }

    const newNote = formData.note.trim();
    const initialNote = initialFormData.note.trim();
    if (newNote !== initialNote) {
      updates.note = newNote || undefined;
    }

    return updates;
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
        // Tryb CREATE: POST /api/pets/:petId/care-entries
        const command: CreateCareEntryCommand = {
          category: formData.category as CareCategoryType,
          entry_date: formatDateForApi(formData.entryDate),
          note: formData.note.trim() || undefined,
        };

        const response = await fetch(`/api/pets/${petId}/care-entries`, {
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

        await response.json();

        // Sukces
        toast.success("Wpis został dodany");

        // Callback lub przekierowanie
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = `/pets/${petId}`;
        }
      } else {
        // Tryb EDIT: PATCH /api/pets/:petId/care-entries/:entryId
        if (!entryId) {
          console.error("CareEntryForm: entryId is required in edit mode");
          toast.error("Wystąpił błąd");
          setIsSubmitting(false);
          return;
        }

        // Partial update - tylko zmienione pola
        const command = buildPartialUpdate();

        // Jeśli nic się nie zmieniło, nie wysyłaj requestu
        if (Object.keys(command).length === 0) {
          toast.info("Nie wprowadzono żadnych zmian");
          setIsSubmitting(false);
          return;
        }

        const response = await fetch(`/api/pets/${petId}/care-entries/${entryId}`, {
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

        await response.json();

        // Sukces
        toast.success("Wpis został zaktualizowany");

        // Callback lub przekierowanie
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = `/pets/${petId}`;
        }
      }
    } catch (error) {
      // Błąd sieci
      console.error("Network error in CareEntryForm:", error);
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
    window.location.href = `/pets/${petId}`;
  };

  // Licznik znaków notatki
  const noteLength = formData.note.length;
  const isNoteWarning = noteLength > 950;

  // Teksty zależne od trybu
  const headerTitle = mode === "edit" ? "Edytuj wpis" : `Dodaj wpis dla ${petName}`;
  const headerDescription =
    mode === "edit" ? "Zaktualizuj kategorię, datę lub notatkę" : "Wybierz kategorię i datę, opcjonalnie dodaj notatkę";
  const submitButtonText = mode === "edit" ? "Zapisz zmiany" : "Zapisz";

  // Sprawdzenie czy przycisk submit powinien być disabled
  const isSubmitDisabled = !isValid || isSubmitting || (mode === "edit" && isUnchanged);

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
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{errors.general}</div>
          )}

          {/* Pole: Kategoria */}
          <div className="space-y-2">
            <p className="text-sm font-medium leading-none">
              Kategoria <span className="text-destructive">*</span>
            </p>
            <CategoryPicker value={formData.category} onChange={handleCategoryChange} error={errors.category} />
          </div>

          {/* Pole: Data */}
          <div className="space-y-2">
            <label htmlFor="entry-date" className="text-sm font-medium leading-none">
              Data <span className="text-destructive">*</span>
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="entry-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-base md:text-sm",
                    !formData.entryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.entryDate ? (
                    format(formData.entryDate, "dd.MM.yyyy", { locale: pl })
                  ) : (
                    <span>Wybierz datę</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.entryDate}
                  onSelect={handleDateChange}
                  initialFocus
                  locale={pl}
                />
              </PopoverContent>
            </Popover>
            {errors.entryDate && <p className="text-sm text-destructive">{errors.entryDate}</p>}
          </div>

          {/* Pole: Notatka */}
          <div className="space-y-2">
            <label htmlFor="note" className="text-sm font-medium leading-none">
              Notatka (opcjonalnie)
            </label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={handleNoteChange}
              maxLength={1000}
              rows={6}
              placeholder="Dodaj szczegóły (opcjonalnie)..."
              className="resize-none text-base md:text-sm"
              aria-describedby="note-counter"
            />
            <div className="flex justify-between items-center text-xs">
              <span
                id="note-counter"
                className={cn("text-muted-foreground", isNoteWarning && "text-destructive font-medium")}
              >
                {noteLength}/1000
              </span>
              {isNoteWarning && <span className="text-destructive">Zbliżasz się do limitu</span>}
            </div>
            {errors.note && <p className="text-sm text-destructive">{errors.note}</p>}
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
          <Button type="submit" disabled={isSubmitDisabled} className="min-h-[44px] sm:min-h-0">
            {isSubmitting ? "Zapisywanie..." : submitButtonText}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
