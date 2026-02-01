import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../../../src/pages/api/pets";

// Mock Supabase client
vi.mock("../../../../src/db/supabase.client", () => ({
  createSupabaseServerInstance: vi.fn(),
}));

// Mock Zod schema
vi.mock("../../../../src/lib/schemas", () => ({
  CreatePetSchema: {
    safeParse: vi.fn(),
  },
}));

import { createSupabaseServerInstance } from "../../../../src/db/supabase.client";
import { CreatePetSchema } from "../../../../src/lib/schemas";

describe("POST /api/pets", () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn(),
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSupabaseServerInstance).mockReturnValue(mockSupabase);
  });

  describe("Input validation", () => {
    it("should return 400 for invalid JSON", async () => {
      const context = {
        request: { json: vi.fn().mockRejectedValue(new Error("Invalid JSON")) },
        locals: { user: { id: "user-123" } },
      };

      const response = await POST(context);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toMatchInlineSnapshot(`
        {
          "error": "Bad Request",
          "message": "Nieprawidłowy format JSON",
        }
      `);
    });

    it("should return 400 for Zod validation failure", async () => {
      const validationErrors = [
        { field: "name", message: "Required" },
        { field: "species", message: "Invalid enum value" },
      ];

      vi.mocked(CreatePetSchema.safeParse).mockReturnValue({
        success: false,
        error: { errors: validationErrors.map((err) => ({ path: [err.field], message: err.message })) },
      });

      const context = {
        request: { json: vi.fn().mockResolvedValue({ name: "", species: "invalid" }) },
        locals: { user: { id: "user-123" } },
      };

      const response = await POST(context);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toMatchInlineSnapshot(`
        {
          "details": [
            {
              "field": "name",
              "message": "Required",
            },
            {
              "field": "species",
              "message": "Invalid enum value",
            },
          ],
          "error": "Validation Failed",
          "message": "Walidacja danych wejściowych nie powiodła się",
        }
      `);
    });
  });

  describe("Duplicate pet check", () => {
    it("should return 409 when pet with same name exists for user", async () => {
      vi.mocked(CreatePetSchema.safeParse).mockReturnValue({
        success: true,
        data: { name: "Buddy", species: "dog" },
      });

      // Mock existing pet found
      mockSupabase.select.mockResolvedValue({ id: "pet-123", name: "Buddy" });
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.ilike.mockReturnValue(mockSupabase);
      mockSupabase.limit.mockResolvedValue([{ id: "pet-123", name: "Buddy" }]);

      // Mock ownership check - user owns this pet
      const ownershipMock = vi.fn().mockResolvedValue([{ pet_id: "pet-123" }]);
      mockSupabase.eq.mockReturnValue({ single: ownershipMock });

      const context = {
        request: { json: vi.fn().mockResolvedValue({ name: "Buddy", species: "dog" }) },
        locals: { user: { id: "user-123" } },
      };

      const response = await POST(context);

      expect(response.status).toBe(409);
      const body = await response.json();
      expect(body.message).toBe('Zwierzę o imieniu "Buddy" już istnieje w Twoim profilu');
    });
  });

  describe("Successful pet creation", () => {
    it("should return 201 with created pet data", async () => {
      vi.mocked(CreatePetSchema.safeParse).mockReturnValue({
        success: true,
        data: { name: "Luna", species: "cat" },
      });

      // No existing pet
      mockSupabase.limit.mockResolvedValue([]);

      // Mock successful insert
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({
        id: "pet-456",
        animal_code: "LN-001",
        name: "Luna",
        species: "cat",
        created_at: "2024-01-01T00:00:00Z",
      });

      const context = {
        request: { json: vi.fn().mockResolvedValue({ name: "Luna", species: "cat" }) },
        locals: { user: { id: "user-123" } },
      };

      const response = await POST(context);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toMatchInlineSnapshot(`
        {
          "animal_code": "LN-001",
          "created_at": "2024-01-01T00:00:00Z",
          "id": "pet-456",
          "name": "Luna",
          "species": "cat",
        }
      `);
    });
  });

  describe("Authentication checks", () => {
    it("should return 401 when user is not authenticated", async () => {
      const context = {
        request: { json: vi.fn().mockResolvedValue({}) },
        locals: { user: null },
      };

      const response = await POST(context);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.message).toBe("Użytkownik nie jest zalogowany");
    });
  });
});
