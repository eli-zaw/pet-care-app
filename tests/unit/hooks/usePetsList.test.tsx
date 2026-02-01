import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { usePetsList } from "../../../../src/lib/hooks/usePetsList";

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock window for mobile detection
const mockInnerWidth = vi.fn();
Object.defineProperty(window, "innerWidth", {
  get: mockInnerWidth,
  configurable: true,
});

const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
Object.defineProperty(window, "addEventListener", {
  value: mockAddEventListener,
  configurable: true,
});
Object.defineProperty(window, "removeEventListener", {
  value: mockRemoveEventListener,
  configurable: true,
});

describe("usePetsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInnerWidth.mockReturnValue(1024); // Desktop by default
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial state", () => {
    it("should start with loading state", () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [],
            pagination: { page: 1, limit: 20, total: 0 },
          })
        )
      );

      const { result } = renderHook(() => usePetsList());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe("Successful data fetching", () => {
    it("should fetch and map pets data correctly", async () => {
      const mockResponse = {
        items: [
          {
            id: "pet-1",
            name: "Buddy",
            species_emoji: "🐕",
            entries_count: 5,
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
        },
      };

      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockResponse)));

      const { result } = renderHook(() => usePetsList());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toMatchInlineSnapshot(`
        {
          "emptyState": {
            "ctaLabel": "Dodaj zwierzę",
            "description": "Zacznij dokumentować opiekę nad swoim zwierzęciem",
            "title": "Dodaj swojego pierwszego pupila",
          },
          "header": {
            "countLabel": "Masz 1 zwierzę",
            "title": "Twoje zwierzęta",
          },
          "pagination": {
            "hasNext": false,
            "hasPrev": false,
            "limit": 20,
            "page": 1,
            "total": 1,
            "totalPages": 1,
          },
          "pets": [
            {
              "entriesCount": 5,
              "entriesLabel": "5 wpisów",
              "href": "/pets/pet-1",
              "id": "pet-1",
              "name": "Buddy",
              "speciesEmoji": "🐕",
            },
          ],
        }
      `);
      expect(result.current.error).toBeNull();
    });

    it("should handle empty pets list", async () => {
      const mockResponse = {
        items: [],
        pagination: { page: 1, limit: 20, total: 0 },
      };

      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockResponse)));

      const { result } = renderHook(() => usePetsList());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.pets).toEqual([]);
      expect(result.current.data?.header.countLabel).toBe("Nie masz jeszcze zwierząt");
    });
  });

  describe("Error handling", () => {
    it("should handle HTTP errors", async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ message: "Database error" }), { status: 500 }));

      const { result } = renderHook(() => usePetsList());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error?.message).toBe("Database error");
      expect(result.current.data).toBeNull();
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => usePetsList());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error?.message).toBe("Failed to fetch pets");
    });
  });

  describe("Pagination", () => {
    it("should load more on mobile when hasNext is true", async () => {
      mockInnerWidth.mockReturnValue(600); // Mobile

      const initialResponse = {
        items: [{ id: "pet-1", name: "Buddy", species_emoji: "🐕", entries_count: 1 }],
        pagination: { page: 1, limit: 20, total: 40 },
      };

      const loadMoreResponse = {
        items: [{ id: "pet-2", name: "Luna", species_emoji: "🐱", entries_count: 2 }],
        pagination: { page: 2, limit: 20, total: 40 },
      };

      mockFetch
        .mockResolvedValueOnce(new Response(JSON.stringify(initialResponse)))
        .mockResolvedValueOnce(new Response(JSON.stringify(loadMoreResponse)));

      const { result } = renderHook(() => usePetsList());

      await waitFor(() => {
        expect(result.current.data?.pets).toHaveLength(1);
      });

      act(() => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.data?.pets).toHaveLength(2);
      });

      expect(result.current.data?.pets[0].name).toBe("Buddy");
      expect(result.current.data?.pets[1].name).toBe("Luna");
    });

    it("should replace data on desktop when changing page", async () => {
      const page1Response = {
        items: [{ id: "pet-1", name: "Buddy", species_emoji: "🐕", entries_count: 1 }],
        pagination: { page: 1, limit: 20, total: 40 },
      };

      const page2Response = {
        items: [{ id: "pet-2", name: "Luna", species_emoji: "🐱", entries_count: 2 }],
        pagination: { page: 2, limit: 20, total: 40 },
      };

      mockFetch
        .mockResolvedValueOnce(new Response(JSON.stringify(page1Response)))
        .mockResolvedValueOnce(new Response(JSON.stringify(page2Response)));

      const { result } = renderHook(() => usePetsList());

      await waitFor(() => {
        expect(result.current.data?.pets).toHaveLength(1);
      });

      act(() => {
        result.current.setPage(2);
      });

      await waitFor(() => {
        expect(result.current.data?.pets).toHaveLength(1);
      });

      expect(result.current.data?.pets[0].name).toBe("Luna");
      expect(result.current.data?.pagination.page).toBe(2);
    });

    it("should not load more when already loading", async () => {
      mockInnerWidth.mockReturnValue(600); // Mobile

      const mockResponse = {
        items: [{ id: "pet-1", name: "Buddy", species_emoji: "🐕", entries_count: 1 }],
        pagination: { page: 1, limit: 20, total: 40 },
      };

      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockResponse)));

      const { result } = renderHook(() => usePetsList());

      // While still loading, try to load more
      act(() => {
        result.current.loadMore();
      });

      // Should not make additional fetch call
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Mobile detection", () => {
    it("should detect mobile screen size", () => {
      mockInnerWidth.mockReturnValue(600);

      renderHook(() => usePetsList());

      expect(mockAddEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
    });

    it("should detect desktop screen size", () => {
      mockInnerWidth.mockReturnValue(1024);

      renderHook(() => usePetsList());

      expect(mockAddEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
    });
  });

  describe("Query parameters", () => {
    it("should use custom initial query", () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [],
            pagination: { page: 1, limit: 10, total: 0 },
          })
        )
      );

      renderHook(() => usePetsList({ page: 2, limit: 10 }));

      expect(mockFetch).toHaveBeenCalledWith("/api/pets?page=2&limit=10&include=summary");
    });

    it("should build correct query string", () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [],
            pagination: { page: 1, limit: 20, total: 0 },
          })
        )
      );

      renderHook(() => usePetsList({ page: 3, limit: 50 }));

      expect(mockFetch).toHaveBeenCalledWith("/api/pets?page=3&limit=50&include=summary");
    });
  });
});
