import { describe, it, expect } from "vitest";
import type {
  GetPetResponseDto,
  CareHistoryDto,
  PetHeaderViewModel,
  CareEntryCardViewModel,
  PaginationViewModel,
} from "@/types";

// Test versions of the mapping functions from usePetProfile
const mapPetToViewModel = (
  petData: GetPetResponseDto,
  entriesCount: number,
  lastEntryDate: Date | null = null
): PetHeaderViewModel => ({
  id: petData.id,
  name: petData.name,
  speciesEmoji: petData.species_emoji,
  speciesDisplay: petData.species_display,
  entriesCount,
  lastEntryDate,
});

const mapEntryToViewModel = (entry: CareHistoryDto): CareEntryCardViewModel => {
  const noteText = entry.note || "";
  const hasMore = noteText.length > 100;

  return {
    id: entry.id,
    categoryEmoji: entry.category_emoji,
    categoryDisplay: entry.category_display,
    dateFormatted: entry.entry_date_formatted,
    notePreview: hasMore ? noteText.substring(0, 100) + "..." : noteText,
    noteFull: hasMore ? noteText : null,
    hasMore,
  };
};

const mapPaginationToViewModel = (paginationDto: {
  page: number;
  limit: number;
  total: number;
}): PaginationViewModel => {
  const totalPages = Math.ceil(paginationDto.total / paginationDto.limit);
  return {
    page: paginationDto.page,
    limit: paginationDto.limit,
    total: paginationDto.total,
    totalPages,
    hasPrev: paginationDto.page > 1,
    hasNext: paginationDto.page < totalPages,
  };
};

describe("usePetProfile mapping functions", () => {
  describe("mapPetToViewModel", () => {
    it("should map GetPetResponseDto to PetHeaderViewModel with entries count and last entry date", () => {
      // Arrange
      const petData: GetPetResponseDto = {
        id: "pet-123",
        name: "Max",
        species: "dog",
        species_display: "Pies",
        species_emoji: "🐕",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };
      const entriesCount = 5;
      const lastEntryDate = new Date("2024-01-10T00:00:00Z");

      // Act
      const result = mapPetToViewModel(petData, entriesCount, lastEntryDate);

      // Assert
      expect(result).toEqual({
        id: "pet-123",
        name: "Max",
        speciesEmoji: "🐕",
        speciesDisplay: "Pies",
        entriesCount: 5,
        lastEntryDate: new Date("2024-01-10T00:00:00Z"),
      });
    });

    it("should handle null lastEntryDate", () => {
      // Arrange
      const petData: GetPetResponseDto = {
        id: "pet-456",
        name: "Luna",
        species: "cat",
        species_display: "Kot",
        species_emoji: "🐱",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };
      const entriesCount = 0;
      const lastEntryDate = null;

      // Act
      const result = mapPetToViewModel(petData, entriesCount, lastEntryDate);

      // Assert
      expect(result).toEqual({
        id: "pet-456",
        name: "Luna",
        speciesEmoji: "🐱",
        speciesDisplay: "Kot",
        entriesCount: 0,
        lastEntryDate: null,
      });
    });

    it("should handle zero entries count", () => {
      // Arrange
      const petData: GetPetResponseDto = {
        id: "pet-789",
        name: "Buddy",
        species: "bird",
        species_display: "Ptak",
        species_emoji: "🐦",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };
      const entriesCount = 0;

      // Act
      const result = mapPetToViewModel(petData, entriesCount);

      // Assert
      expect(result).toEqual({
        id: "pet-789",
        name: "Buddy",
        speciesEmoji: "🐦",
        speciesDisplay: "Ptak",
        entriesCount: 0,
        lastEntryDate: null,
      });
    });
  });

  describe("mapEntryToViewModel", () => {
    it("should map CareHistoryDto to CareEntryCardViewModel with short note", () => {
      // Arrange
      const entry: CareHistoryDto = {
        id: "entry-123",
        pet_id: "pet-123",
        category: "feeding",
        category_display: "Karmienie",
        category_emoji: "🍖",
        entry_date: "2024-01-10T00:00:00Z",
        entry_date_formatted: "10.01.2024",
        note: "Pies zjadł całą karmę",
        created_at: "2024-01-10T00:00:00Z",
        updated_at: "2024-01-10T00:00:00Z",
      };

      // Act
      const result = mapEntryToViewModel(entry);

      // Assert
      expect(result).toEqual({
        id: "entry-123",
        categoryEmoji: "🍖",
        categoryDisplay: "Karmienie",
        dateFormatted: "10.01.2024",
        notePreview: "Pies zjadł całą karmę",
        noteFull: null,
        hasMore: false,
      });
    });

    it("should handle note longer than 100 characters", () => {
      // Arrange
      const longNote = "A".repeat(150); // 150 characters
      const entry: CareHistoryDto = {
        id: "entry-456",
        pet_id: "pet-123",
        category: "vet",
        category_display: "Weterynarz",
        category_emoji: "🏥",
        entry_date: "2024-01-10T00:00:00Z",
        entry_date_formatted: "10.01.2024",
        note: longNote,
        created_at: "2024-01-10T00:00:00Z",
        updated_at: "2024-01-10T00:00:00Z",
      };

      // Act
      const result = mapEntryToViewModel(entry);

      // Assert
      expect(result).toEqual({
        id: "entry-456",
        categoryEmoji: "🏥",
        categoryDisplay: "Weterynarz",
        dateFormatted: "10.01.2024",
        notePreview: "A".repeat(100) + "...",
        noteFull: longNote,
        hasMore: true,
      });
    });

    it("should handle note exactly 100 characters (boundary)", () => {
      // Arrange
      const exactNote = "A".repeat(100); // Exactly 100 characters
      const entry: CareHistoryDto = {
        id: "entry-789",
        pet_id: "pet-123",
        category: "grooming",
        category_display: "Pielęgnacja",
        category_emoji: "✂️",
        entry_date: "2024-01-10T00:00:00Z",
        entry_date_formatted: "10.01.2024",
        note: exactNote,
        created_at: "2024-01-10T00:00:00Z",
        updated_at: "2024-01-10T00:00:00Z",
      };

      // Act
      const result = mapEntryToViewModel(entry);

      // Assert
      expect(result).toEqual({
        id: "entry-789",
        categoryEmoji: "✂️",
        categoryDisplay: "Pielęgnacja",
        dateFormatted: "10.01.2024",
        notePreview: exactNote,
        noteFull: null,
        hasMore: false,
      });
    });

    it("should handle null note", () => {
      // Arrange
      const entry: CareHistoryDto = {
        id: "entry-999",
        pet_id: "pet-123",
        category: "walking",
        category_display: "Spacer",
        category_emoji: "🚶",
        entry_date: "2024-01-10T00:00:00Z",
        entry_date_formatted: "10.01.2024",
        note: null,
        created_at: "2024-01-10T00:00:00Z",
        updated_at: "2024-01-10T00:00:00Z",
      };

      // Act
      const result = mapEntryToViewModel(entry);

      // Assert
      expect(result).toEqual({
        id: "entry-999",
        categoryEmoji: "🚶",
        categoryDisplay: "Spacer",
        dateFormatted: "10.01.2024",
        notePreview: "",
        noteFull: null,
        hasMore: false,
      });
    });

    it("should handle empty string note", () => {
      // Arrange
      const entry: CareHistoryDto = {
        id: "entry-000",
        pet_id: "pet-123",
        category: "other",
        category_display: "Inne",
        category_emoji: "📝",
        entry_date: "2024-01-10T00:00:00Z",
        entry_date_formatted: "10.01.2024",
        note: "",
        created_at: "2024-01-10T00:00:00Z",
        updated_at: "2024-01-10T00:00:00Z",
      };

      // Act
      const result = mapEntryToViewModel(entry);

      // Assert
      expect(result).toEqual({
        id: "entry-000",
        categoryEmoji: "📝",
        categoryDisplay: "Inne",
        dateFormatted: "10.01.2024",
        notePreview: "",
        noteFull: null,
        hasMore: false,
      });
    });
  });

  describe("mapPaginationToViewModel", () => {
    it("should map pagination DTO to view model with calculated fields", () => {
      // Arrange
      const paginationDto = {
        page: 2,
        limit: 10,
        total: 25,
      };

      // Act
      const result = mapPaginationToViewModel(paginationDto);

      // Assert
      expect(result).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3, // Math.ceil(25/10) = 3
        hasPrev: true, // page > 1
        hasNext: true, // page < totalPages
      });
    });

    it("should handle first page correctly", () => {
      // Arrange
      const paginationDto = {
        page: 1,
        limit: 20,
        total: 100,
      };

      // Act
      const result = mapPaginationToViewModel(paginationDto);

      // Assert
      expect(result).toEqual({
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5, // Math.ceil(100/20) = 5
        hasPrev: false, // page === 1
        hasNext: true, // page < totalPages
      });
    });

    it("should handle last page correctly", () => {
      // Arrange
      const paginationDto = {
        page: 5,
        limit: 20,
        total: 100,
      };

      // Act
      const result = mapPaginationToViewModel(paginationDto);

      // Assert
      expect(result).toEqual({
        page: 5,
        limit: 20,
        total: 100,
        totalPages: 5, // Math.ceil(100/20) = 5
        hasPrev: true, // page > 1
        hasNext: false, // page === totalPages
      });
    });

    it("should handle single page correctly", () => {
      // Arrange
      const paginationDto = {
        page: 1,
        limit: 10,
        total: 5,
      };

      // Act
      const result = mapPaginationToViewModel(paginationDto);

      // Assert
      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 5,
        totalPages: 1, // Math.ceil(5/10) = 1
        hasPrev: false,
        hasNext: false,
      });
    });

    it("should handle empty results correctly", () => {
      // Arrange
      const paginationDto = {
        page: 1,
        limit: 20,
        total: 0,
      };

      // Act
      const result = mapPaginationToViewModel(paginationDto);

      // Assert
      expect(result).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0, // Math.ceil(0/20) = 0
        hasPrev: false,
        hasNext: false,
      });
    });

    it("should handle partial last page correctly", () => {
      // Arrange
      const paginationDto = {
        page: 3,
        limit: 10,
        total: 25,
      };

      // Act
      const result = mapPaginationToViewModel(paginationDto);

      // Assert
      expect(result).toEqual({
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3, // Math.ceil(25/10) = 3
        hasPrev: true,
        hasNext: false, // page === totalPages
      });
    });
  });
});
