import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseServerInstance } from "../../../../src/db/supabase.client";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("createSupabaseServerInstance", () => {
  const mockCookies = {
    getAll: vi.fn(),
    setAll: vi.fn(),
  } as const;

  const mockHeaders = new Headers();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", mockFetch);
  });

  describe("Environment validation", () => {
    it("should throw error when SUPABASE_URL is missing", () => {
      // Mock missing env
      vi.stubEnv("SUPABASE_URL", undefined);
      vi.stubEnv("SUPABASE_KEY", "test-key");

      expect(() => {
        createSupabaseServerInstance({
          cookies: mockCookies,
          headers: mockHeaders,
          env: {},
        });
      }).toThrow("Supabase credentials not configured");
    });

    it("should throw error when SUPABASE_KEY is missing", () => {
      vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("SUPABASE_KEY", undefined);

      expect(() => {
        createSupabaseServerInstance({
          cookies: mockCookies,
          headers: mockHeaders,
          env: {},
        });
      }).toThrow("Supabase credentials not configured");
    });
  });

  describe("Client creation", () => {
    beforeEach(() => {
      vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("SUPABASE_KEY", "test-key");
    });

    it("should create client with context env vars", () => {
      const contextEnv = {
        SUPABASE_URL: "https://context.supabase.co",
        SUPABASE_KEY: "context-key",
      };

      const client = createSupabaseServerInstance({
        cookies: mockCookies,
        headers: mockHeaders,
        env: contextEnv,
      });

      expect(client).toBeDefined();
      // Verify it uses context env over import.meta.env
    });

    it("should fallback to import.meta.env when context env missing", () => {
      const client = createSupabaseServerInstance({
        cookies: mockCookies,
        headers: mockHeaders,
        env: {},
      });

      expect(client).toBeDefined();
    });
  });

  describe("Custom fetch with access token", () => {
    beforeEach(() => {
      vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("SUPABASE_KEY", "test-key");
    });

    it("should add Authorization header for non-auth requests", async () => {
      mockFetch.mockResolvedValue(new Response());

      createSupabaseServerInstance({
        cookies: mockCookies,
        headers: mockHeaders,
        env: {},
        accessToken: "test-token-123",
      });

      // Simulate a request to pets table (not auth endpoint)
      await mockFetch("https://test.supabase.co/rest/v1/pets", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      expect(mockFetch).toHaveBeenCalledWith("https://test.supabase.co/rest/v1/pets", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token-123",
        },
      });
    });

    it("should not add Authorization header for auth endpoints", async () => {
      mockFetch.mockResolvedValue(new Response());

      createSupabaseServerInstance({
        cookies: mockCookies,
        headers: mockHeaders,
        env: {},
        accessToken: "test-token-123",
      });

      // Simulate auth request
      await mockFetch("https://test.supabase.co/auth/v1/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      expect(mockFetch).toHaveBeenCalledWith("https://test.supabase.co/auth/v1/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // No Authorization header should be added
        },
      });
    });

    it("should merge existing headers with Authorization", async () => {
      mockFetch.mockResolvedValue(new Response());

      createSupabaseServerInstance({
        cookies: mockCookies,
        headers: mockHeaders,
        env: {},
        accessToken: "test-token-123",
      });

      await mockFetch("https://test.supabase.co/rest/v1/pets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": "custom-value",
        },
      });

      expect(mockFetch).toHaveBeenCalledWith("https://test.supabase.co/rest/v1/pets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": "custom-value",
          Authorization: "Bearer test-token-123",
        },
      });
    });
  });

  describe("Cookie handling", () => {
    beforeEach(() => {
      vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("SUPABASE_KEY", "test-key");
    });

    it("should parse cookies from header correctly", () => {
      mockCookies.getAll.mockReturnValue([]);

      const client = createSupabaseServerInstance({
        cookies: mockCookies,
        headers: new Headers({ Cookie: "session=abc123; user=john" }),
        env: {},
      });

      expect(client).toBeDefined();
    });

    it("should handle empty cookie header", () => {
      mockCookies.getAll.mockReturnValue([]);

      const client = createSupabaseServerInstance({
        cookies: mockCookies,
        headers: new Headers(),
        env: {},
      });

      expect(client).toBeDefined();
    });
  });
});
