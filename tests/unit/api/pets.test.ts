import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPet } from "../../../src/lib/services/petService";

function createChainMock() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.ilike = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockResolvedValue({ data: [], error: null });
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.in = vi.fn().mockReturnValue(chain);
  return chain;
}

describe("createPet service", () => {
  let petsChain: ReturnType<typeof createChainMock>;
  let petOwnersChain: ReturnType<typeof createChainMock>;
  let mockSupabase: { from: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    petsChain = createChainMock();
    petOwnersChain = createChainMock();
    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "pet_owners") return petOwnersChain;
        return petsChain;
      }),
    };
  });

  describe("Input validation", () => {
    it("should return validation error for invalid data", async () => {
      const invalidData = { name: "", species: "invalid" };

      const result = await createPet(mockSupabase as any, "user-123", invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error).toBe("Validation Failed");
      }
    });
  });

  describe("Duplicate pet check", () => {
    it("should return 409 when pet with same name exists for user", async () => {
      const validData = { name: "Buddy", species: "dog" };

      // Mock: name check finds existing pet
      petsChain.limit.mockResolvedValue({
        data: [{ id: "pet-123", name: "Buddy" }],
        error: null,
      });

      // Mock: ownership check confirms user owns this pet
      petOwnersChain.single.mockResolvedValue({
        data: { pet_id: "pet-123" },
        error: null,
      });

      const result = await createPet(mockSupabase as any, "user-123", validData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(409);
      }
    });
  });

  describe("Successful pet creation", () => {
    it("should return 201 with created pet data", async () => {
      const validData = { name: "Luna", species: "cat" };

      // No existing pet with this name
      petsChain.limit.mockResolvedValue({ data: [], error: null });

      // Mock successful insert - single() is called on the pets chain after insert
      petsChain.single.mockResolvedValue({
        data: {
          id: "pet-456",
          animal_code: "LN-001",
          name: "Luna",
          species: "cat",
          created_at: "2024-01-01T00:00:00Z",
        },
        error: null,
      });

      // Mock ownership insert
      petOwnersChain.insert.mockReturnValue({
        ...petOwnersChain,
        then: (resolve: Function) =>
          resolve({ error: null }),
      });

      const result = await createPet(mockSupabase as any, "user-123", validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          id: "pet-456",
          animal_code: "LN-001",
          name: "Luna",
          species: "cat",
          created_at: "2024-01-01T00:00:00Z",
        });
      }
    });
  });

  describe("Database errors", () => {
    it("should handle database errors during pet creation", async () => {
      const validData = { name: "Max", species: "dog" };

      // No existing pet
      petsChain.limit.mockResolvedValue({ data: [], error: null });

      // Mock database error on insert
      petsChain.single.mockResolvedValue({
        data: null,
        error: { message: "Database connection failed", code: "PGRST000" },
      });

      const result = await createPet(mockSupabase as any, "user-123", validData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(500);
      }
    });
  });
});
