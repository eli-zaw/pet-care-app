import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { PetFormErrors } from "@/types";

// Mock toast from sonner for handleApiError tests
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: mockToastError,
  },
}));

// Test versions of PetForm functions
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

const createValidateForm = (mode: "create" | "edit") => {
  return (formData: { name: string; species: string }): { isValid: boolean; errors: PetFormErrors } => {
    const newErrors: PetFormErrors = {};

    const nameError = validateName(formData.name);
    if (nameError) {
      newErrors.name = nameError;
    }

    // W trybie edit gatunek jest disabled, więc nie walidujemy
    if (mode === "create" && formData.species === "") {
      newErrors.species = "Gatunek jest wymagany";
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };
};

const handleApiError = (
  status: number,
  data: { error?: string; message?: string },
  setErrors: (updater: (prev: PetFormErrors) => PetFormErrors) => void
) => {
  switch (status) {
    case 400:
      // Błąd walidacji
      mockToastError("Sprawdź poprawność danych");
      if (data.message) {
        setErrors((prev) => ({ ...prev, general: data.message }));
      }
      break;
    case 401:
      // Brak sesji
      mockToastError("Sesja wygasła");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      break;
    case 403:
      // Brak dostępu (tylko w trybie edit)
      mockToastError("Brak dostępu do tego zwierzęcia");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
      break;
    case 404:
      // Zwierzę nie znalezione (tylko w trybie edit)
      mockToastError("Zwierzę nie znalezione");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
      break;
    case 409:
      // Konflikt nazwy
      mockToastError("Zwierzę o tej nazwie już istnieje");
      setErrors((prev) => ({
        ...prev,
        name: "Zwierzę o tej nazwie już istnieje",
      }));
      break;
    case 500:
      // Błąd serwera
      mockToastError("Coś poszło nie tak. Spróbuj ponownie.");
      break;
    default:
      mockToastError("Wystąpił nieoczekiwany błąd");
  }
};

const createIsValid = (formData: { name: string; species: string }) => {
  const trimmedName = formData.name.trim();
  const hasValidName = trimmedName.length > 0 && trimmedName.length <= 50;
  const hasValidSpecies = formData.species !== "";
  return hasValidName && hasValidSpecies;
};

const createIsUnchanged = (mode: "create" | "edit", formData: { name: string }, initialName: string) => {
  if (mode !== "edit") return false;
  return formData.name.trim() === initialName;
};

describe("PetForm validation and business logic", () => {
  describe("validateName", () => {
    it("should return undefined for valid names", () => {
      // Arrange & Act & Assert
      expect(validateName("Max")).toBeUndefined();
      expect(validateName("Luna")).toBeUndefined();
      expect(validateName("Reksio")).toBeUndefined();
    });

    it("should return error for empty name after trimming", () => {
      // Arrange & Act & Assert
      expect(validateName("")).toBe("Imię jest wymagane");
      expect(validateName("   ")).toBe("Imię jest wymagane");
      expect(validateName("\t\n")).toBe("Imię jest wymagane");
    });

    it("should return error for name longer than 50 characters", () => {
      // Arrange
      const longName = "A".repeat(51); // 51 characters

      // Act & Assert
      expect(validateName(longName)).toBe("Imię może mieć maksymalnie 50 znaków");
    });

    it("should accept name exactly 50 characters long", () => {
      // Arrange
      const exactName = "A".repeat(50); // Exactly 50 characters

      // Act & Assert
      expect(validateName(exactName)).toBeUndefined();
    });

    it("should trim whitespace before validation", () => {
      // Arrange & Act & Assert
      expect(validateName("  Max  ")).toBeUndefined();
      expect(validateName("\tLuna\n")).toBeUndefined();
    });

    it("should return error for name that becomes empty after trimming", () => {
      // Arrange & Act & Assert
      expect(validateName("   ")).toBe("Imię jest wymagane");
    });

    describe("edge cases", () => {
      it("should handle special characters", () => {
        // Arrange & Act & Assert
        expect(validateName("Max🐕")).toBeUndefined();
        expect(validateName("Luna-Marie")).toBeUndefined();
      });

      it("should handle unicode characters", () => {
        // Arrange & Act & Assert
        expect(validateName("Łukasz")).toBeUndefined();
        expect(validateName("Björk")).toBeUndefined();
      });

      it("should handle numbers in names", () => {
        // Arrange & Act & Assert
        expect(validateName("Max123")).toBeUndefined();
        expect(validateName("Luna_2")).toBeUndefined();
      });
    });
  });

  describe("validateForm", () => {
    describe("in create mode", () => {
      const validateFormCreate = createValidateForm("create");

      it("should return valid true for complete valid data", () => {
        // Arrange
        const formData = { name: "Max", species: "dog" };

        // Act
        const result = validateFormCreate(formData);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it("should return invalid for missing name", () => {
        // Arrange
        const formData = { name: "", species: "dog" };

        // Act
        const result = validateFormCreate(formData);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual({
          name: "Imię jest wymagane",
        });
      });

      it("should return invalid for missing species", () => {
        // Arrange
        const formData = { name: "Max", species: "" };

        // Act
        const result = validateFormCreate(formData);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual({
          species: "Gatunek jest wymagany",
        });
      });

      it("should return invalid for both name and species errors", () => {
        // Arrange
        const formData = { name: "", species: "" };

        // Act
        const result = validateFormCreate(formData);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual({
          name: "Imię jest wymagane",
          species: "Gatunek jest wymagany",
        });
      });

      it("should return invalid for name too long", () => {
        // Arrange
        const formData = { name: "A".repeat(51), species: "cat" };

        // Act
        const result = validateFormCreate(formData);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual({
          name: "Imię może mieć maksymalnie 50 znaków",
        });
      });
    });

    describe("in edit mode", () => {
      const validateFormEdit = createValidateForm("edit");

      it("should return valid true for valid name (species not validated)", () => {
        // Arrange
        const formData = { name: "Max", species: "" };

        // Act
        const result = validateFormEdit(formData);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it("should return invalid for invalid name", () => {
        // Arrange
        const formData = { name: "", species: "dog" };

        // Act
        const result = validateFormEdit(formData);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual({
          name: "Imię jest wymagane",
        });
      });

      it("should return invalid for name too long", () => {
        // Arrange
        const formData = { name: "A".repeat(51), species: "cat" };

        // Act
        const result = validateFormEdit(formData);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual({
          name: "Imię może mieć maksymalnie 50 znaków",
        });
      });
    });
  });

  describe("handleApiError", () => {
    let mockSetErrors: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockSetErrors = vi.fn();
      // Mock window.location for navigation tests
      Object.defineProperty(window, "location", {
        value: { href: "" },
        writable: true,
      });

      // Mock setTimeout
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllMocks();
      vi.useRealTimers();
    });

    it("should handle 400 validation error with message by setting general error", () => {
      // Arrange
      const status = 400;
      const data = { message: "Invalid data format" };

      // Act
      handleApiError(status, data, mockSetErrors);

      // Assert - check that setErrors was called with correct updater
      expect(mockSetErrors).toHaveBeenCalledWith(expect.any(Function));
      const updater = mockSetErrors.mock.calls[0][0];
      const result = updater({});
      expect(result).toEqual({ general: "Invalid data format" });
    });

    it("should handle 400 validation error without message without calling setErrors", () => {
      // Arrange
      const status = 400;
      const data = {};

      // Act
      handleApiError(status, data, mockSetErrors);

      // Assert
      expect(mockSetErrors).not.toHaveBeenCalled();
    });

    it("should handle 401 session expired by redirecting to home", () => {
      // Arrange
      const status = 401;
      const data = {};

      // Act
      handleApiError(status, data, mockSetErrors);

      // Assert - check navigation after timeout
      vi.advanceTimersByTime(1000);
      expect(window.location.href).toBe("/");
    });

    it("should handle 403 access denied by redirecting to dashboard", () => {
      // Arrange
      const status = 403;
      const data = {};

      // Act
      handleApiError(status, data, mockSetErrors);

      // Assert - check navigation after timeout
      vi.advanceTimersByTime(1000);
      expect(window.location.href).toBe("/dashboard");
    });

    it("should handle 404 not found by redirecting to dashboard", () => {
      // Arrange
      const status = 404;
      const data = {};

      // Act
      handleApiError(status, data, mockSetErrors);

      // Assert - check navigation after timeout
      vi.advanceTimersByTime(1000);
      expect(window.location.href).toBe("/dashboard");
    });

    it("should handle 409 name conflict by setting name error", () => {
      // Arrange
      const status = 409;
      const data = {};

      // Act
      handleApiError(status, data, mockSetErrors);

      // Assert - check that setErrors was called with name error
      expect(mockSetErrors).toHaveBeenCalledWith(expect.any(Function));
      const updater = mockSetErrors.mock.calls[0][0];
      const result = updater({});
      expect(result).toEqual({ name: "Zwierzę o tej nazwie już istnieje" });
    });

    it("should handle 500 server error without calling setErrors", () => {
      // Arrange
      const status = 500;
      const data = {};

      // Act
      handleApiError(status, data, mockSetErrors);

      // Assert
      expect(mockSetErrors).not.toHaveBeenCalled();
    });

    it("should handle unknown status codes without calling setErrors", () => {
      // Arrange
      const status = 418; // I'm a teapot
      const data = {};

      // Act
      handleApiError(status, data, mockSetErrors);

      // Assert
      expect(mockSetErrors).not.toHaveBeenCalled();
    });
  });

  describe("computed values", () => {
    describe("isValid", () => {
      it("should return true for valid form data", () => {
        // Arrange & Act & Assert
        expect(createIsValid({ name: "Max", species: "dog" })).toBe(true);
        expect(createIsValid({ name: "Luna", species: "cat" })).toBe(true);
        expect(createIsValid({ name: "Rex", species: "other" })).toBe(true);
      });

      it("should return false for empty name", () => {
        // Arrange & Act & Assert
        expect(createIsValid({ name: "", species: "dog" })).toBe(false);
        expect(createIsValid({ name: "   ", species: "dog" })).toBe(false);
      });

      it("should return false for name too long", () => {
        // Arrange & Act & Assert
        expect(createIsValid({ name: "A".repeat(51), species: "dog" })).toBe(false);
      });

      it("should return false for empty species", () => {
        // Arrange & Act & Assert
        expect(createIsValid({ name: "Max", species: "" })).toBe(false);
      });

      it("should return false when both name and species are invalid", () => {
        // Arrange & Act & Assert
        expect(createIsValid({ name: "", species: "" })).toBe(false);
        expect(createIsValid({ name: "A".repeat(51), species: "" })).toBe(false);
      });

      it("should handle whitespace in name", () => {
        // Arrange & Act & Assert
        expect(createIsValid({ name: "  Max  ", species: "dog" })).toBe(true);
        expect(createIsValid({ name: "   ", species: "dog" })).toBe(false);
      });
    });

    describe("isUnchanged", () => {
      it("should return false in create mode", () => {
        // Arrange & Act & Assert
        expect(createIsUnchanged("create", { name: "Max" }, "Luna")).toBe(false);
        expect(createIsUnchanged("create", { name: "Max" }, "Max")).toBe(false);
      });

      it("should return true in edit mode when name matches initial", () => {
        // Arrange & Act & Assert
        expect(createIsUnchanged("edit", { name: "Max" }, "Max")).toBe(true);
        expect(createIsUnchanged("edit", { name: "  Max  " }, "Max")).toBe(true); // with trimming
      });

      it("should return false in edit mode when name differs", () => {
        // Arrange & Act & Assert
        expect(createIsUnchanged("edit", { name: "Luna" }, "Max")).toBe(false);
        expect(createIsUnchanged("edit", { name: "Max2" }, "Max")).toBe(false);
      });

      it("should return false in edit mode when name is empty", () => {
        // Arrange & Act & Assert
        expect(createIsUnchanged("edit", { name: "" }, "Max")).toBe(false);
      });

      it("should handle whitespace correctly", () => {
        // Arrange & Act & Assert
        // Note: initialName is not trimmed in the actual component logic
        expect(createIsUnchanged("edit", { name: "  Max  " }, "Max")).toBe(true); // "  Max  ".trim() === "Max"
        expect(createIsUnchanged("edit", { name: "Max" }, "Max")).toBe(true); // "Max".trim() === "Max"
      });
    });
  });
});
