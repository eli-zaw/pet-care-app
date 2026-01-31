import { useCallback, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { GetPetResponseDto, PetFormViewModel, SpeciesType } from "@/types";
import { createPet, updatePet } from "@/lib/api/pets";
import type { ApiError } from "@/lib/api/pets";

type PetFormMode = "create" | "edit";

interface UsePetFormOptions {
  mode?: PetFormMode;
  petId?: string;
  initialData?: GetPetResponseDto;
  onSuccess?: (petId: string) => void;
}

export const usePetForm = ({ mode = "create", petId, initialData, onSuccess }: UsePetFormOptions) => {
  const defaultValues = useMemo<PetFormViewModel>(() => {
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
  }, [mode, initialData]);

  const form = useForm<PetFormViewModel>({
    defaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
    criteriaMode: "all",
  });

  const { control, reset, setError } = form;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const initialName = useMemo(() => {
    if (mode === "edit" && initialData) {
      return initialData.name;
    }
    return "";
  }, [mode, initialData]);

  const watchedName = useWatch({ control, name: "name" });
  const isUnchanged = useMemo(() => {
    if (mode !== "edit") return false;
    return (watchedName ?? "").trim() === initialName;
  }, [mode, watchedName, initialName]);

  const validateName = useCallback((value: string) => {
    const trimmedName = value.trim();
    if (trimmedName.length === 0) {
      return "Imię jest wymagane";
    }
    if (trimmedName.length > 50) {
      return "Imię może mieć maksymalnie 50 znaków";
    }
    return true;
  }, []);

  const validateSpecies = useCallback(
    (value: string) => {
      if (mode === "create" && value === "") {
        return "Gatunek jest wymagany";
      }
      return true;
    },
    [mode]
  );

  const handleApiError = useCallback(
    (error: ApiError) => {
      switch (error.status) {
        case 400:
          toast.error("Sprawdź poprawność danych");
          if (error.data.message) {
            setError("root", { message: error.data.message });
          }
          break;
        case 401:
          toast.error("Sesja wygasła");
          setTimeout(() => {
            window.location.assign("/");
          }, 1000);
          break;
        case 403:
          toast.error("Brak dostępu do tego zwierzęcia");
          setTimeout(() => {
            window.location.assign("/dashboard");
          }, 1000);
          break;
        case 404:
          toast.error("Zwierzę nie znalezione");
          setTimeout(() => {
            window.location.assign("/dashboard");
          }, 1000);
          break;
        case 409:
          toast.error("Zwierzę o tej nazwie już istnieje");
          setError("name", { message: "Zwierzę o tej nazwie już istnieje" });
          break;
        case 500:
          toast.error("Coś poszło nie tak. Spróbuj ponownie.");
          break;
        default:
          toast.error("Wystąpił nieoczekiwany błąd");
      }
    },
    [setError]
  );

  const onSubmit = useCallback(
    async (values: PetFormViewModel) => {
      if (mode === "create") {
        const result = await createPet({
          name: values.name.trim(),
          species: values.species as SpeciesType,
        });
        toast.success("Zwierzę zostało dodane");
        if (onSuccess) {
          onSuccess(result.id);
        } else {
          window.location.assign(`/pets/${result.id}`);
        }
        return;
      }

      if (!petId) {
        toast.error("Wystąpił błąd");
        return;
      }

      const result = await updatePet(petId, {
        name: values.name.trim(),
      });
      toast.success("Zmiany zostały zapisane");
      if (onSuccess) {
        onSuccess(result.id);
      } else {
        window.location.assign(`/pets/${result.id}`);
      }
    },
    [mode, onSuccess, petId]
  );

  const submitHandler = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      if (typeof error === "object" && error !== null && "status" in error) {
        handleApiError(error as ApiError);
        return;
      }

      if (error instanceof TypeError) {
        toast.error("Brak połączenia. Sprawdź internet.");
      } else {
        toast.error("Wystąpił nieoczekiwany błąd");
      }
    }
  });

  return {
    form,
    mode,
    isUnchanged,
    nameRules: { validate: validateName },
    speciesRules: { validate: validateSpecies },
    submitHandler,
  };
};
