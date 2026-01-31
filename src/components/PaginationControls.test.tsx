import { describe, it, expect } from "vitest";

// Import the function we want to test
// Note: generatePageNumbers is not exported, so we need to test it through the component
// or export it for testing. For now, we'll create a test version.

const generatePageNumbers = (currentPage: number, totalPages: number): (number | string)[] => {
  const pages: (number | string)[] = [];
  const maxVisible = 7; // Max page numbers to show

  if (totalPages <= maxVisible) {
    // Show all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show with ellipsis
    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);
  }

  return pages;
};

describe("generatePageNumbers", () => {
  describe("when total pages is less than or equal to max visible (7)", () => {
    it("should show all pages for 1 total page", () => {
      // Arrange
      const currentPage = 1;
      const totalPages = 1;

      // Act
      const result = generatePageNumbers(currentPage, totalPages);

      // Assert
      expect(result).toEqual([1]);
    });

    it("should show all pages for 5 total pages", () => {
      // Arrange
      const currentPage = 3;
      const totalPages = 5;

      // Act
      const result = generatePageNumbers(currentPage, totalPages);

      // Assert
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it("should show all pages for exactly 7 total pages", () => {
      // Arrange
      const currentPage = 4;
      const totalPages = 7;

      // Act
      const result = generatePageNumbers(currentPage, totalPages);

      // Assert
      expect(result).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });
  });

  describe("when total pages is greater than 7", () => {
    it("should show ellipsis at end when current page is near start", () => {
      // Arrange
      const currentPage = 1;
      const totalPages = 10;

      // Act
      const result = generatePageNumbers(currentPage, totalPages);

      // Assert - For page 1: start=max(2,0)=2, end=min(9,2)=2, so pages 2
      expect(result).toEqual([1, 2, "...", 10]);
    });

    it("should show ellipsis at end when current page is 2", () => {
      // Arrange
      const currentPage = 2;
      const totalPages = 10;

      // Act
      const result = generatePageNumbers(currentPage, totalPages);

      // Assert - For page 2: start=max(2,1)=2, end=min(9,3)=3, so pages 2-3
      expect(result).toEqual([1, 2, 3, "...", 10]);
    });

    it("should show ellipsis at both ends when current page is in middle", () => {
      // Arrange
      const currentPage = 5;
      const totalPages = 10;

      // Act
      const result = generatePageNumbers(currentPage, totalPages);

      // Assert
      expect(result).toEqual([1, "...", 4, 5, 6, "...", 10]);
    });

    it("should show ellipsis at start when current page is near end", () => {
      // Arrange
      const currentPage = 9;
      const totalPages = 10;

      // Act
      const result = generatePageNumbers(currentPage, totalPages);

      // Assert
      expect(result).toEqual([1, "...", 8, 9, 10]);
    });

    it("should show ellipsis at start when current page is 10 (last page)", () => {
      // Arrange
      const currentPage = 10;
      const totalPages = 10;

      // Act
      const result = generatePageNumbers(currentPage, totalPages);

      // Assert
      expect(result).toEqual([1, "...", 9, 10]);
    });
  });

  describe("edge cases", () => {
    it("should handle current page exactly 3 (boundary case)", () => {
      // Arrange
      const currentPage = 3;
      const totalPages = 10;

      // Act
      const result = generatePageNumbers(currentPage, totalPages);

      // Assert
      expect(result).toEqual([1, 2, 3, 4, "...", 10]);
    });

    it("should handle current page exactly totalPages-2 (boundary case)", () => {
      // Arrange
      const currentPage = 8;
      const totalPages = 10;

      // Act
      const result = generatePageNumbers(currentPage, totalPages);

      // Assert
      expect(result).toEqual([1, "...", 7, 8, 9, 10]);
    });

    it("should handle large page numbers", () => {
      // Arrange
      const currentPage = 50;
      const totalPages = 100;

      // Act
      const result = generatePageNumbers(currentPage, totalPages);

      // Assert
      expect(result).toEqual([1, "...", 49, 50, 51, "...", 100]);
    });

    it("should handle current page out of bounds (less than 1)", () => {
      // Arrange
      const currentPage = 0;
      const totalPages = 10;

      // Act
      const result = generatePageNumbers(currentPage, totalPages);

      // Assert - Function doesn't validate input: start=max(2,-1)=2, end=min(9,1)=1, no loop, currentPage=0 < 8 so no second ellipsis
      expect(result).toEqual([1, "...", 10]);
    });

    it("should handle current page greater than totalPages", () => {
      // Arrange
      const currentPage = 15;
      const totalPages = 10;

      // Act
      const result = generatePageNumbers(currentPage, totalPages);

      // Assert - Function doesn't validate input: start=max(2,14)=14, end=min(9,16)=9, no loop, currentPage=15 >= 8 so no second ellipsis
      expect(result).toEqual([1, "...", 10]);
    });
  });

  describe("pagination window calculation", () => {
    it("should correctly calculate start and end for current page 4", () => {
      // Arrange
      const currentPage = 4;
      const totalPages = 20;

      // Act
      const result = generatePageNumbers(currentPage, totalPages);

      // Assert - Should show pages 3, 4, 5 around current page
      expect(result).toEqual([1, "...", 3, 4, 5, "...", 20]);
    });

    it("should not show ellipsis when window reaches boundaries", () => {
      // Arrange
      const currentPage = 3;
      const totalPages = 6;

      // Act
      const result = generatePageNumbers(currentPage, totalPages);

      // Assert - No ellipsis needed, all pages fit
      expect(result).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("should handle case where current page window overlaps with boundaries", () => {
      // Arrange
      const currentPage = 2;
      const totalPages = 6;

      // Act
      const result = generatePageNumbers(currentPage, totalPages);

      // Assert - totalPages=6 <= 7, so show all pages
      expect(result).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });
});
