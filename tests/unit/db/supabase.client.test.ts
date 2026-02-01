import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseServerInstance } from "../../../src/db/supabase.client";
import { createServerClient } from "@supabase/ssr";

// Mock @supabase/ssr to capture the custom fetch passed to createServerClient
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({})),
}));

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
      vi.stubEnv("SUPABASE_URL", "");
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
      vi.stubEnv("SUPABASE_KEY", "");

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

    function getCustomFetch() {
      const mockCreate = vi.mocked(createServerClient);
      const lastCall = mockCreate.mock.calls[mockCreate.mock.calls.length - 1];
      return lastCall[2]?.global?.fetch;
    }

    it("should add Authorization header for non-auth requests", async () => {
      mockFetch.mockResolvedValue(new Response());

      createSupabaseServerInstance({
        cookies: mockCookies,
        headers: mockHeaders,
        env: {},
        accessToken: "test-token-123",
      });

      const customFetch = getCustomFetch();
      expect(customFetch).toBeDefined();

      // Call the custom fetch with a non-auth URL
      await customFetch!("https://test.supabase.co/rest/v1/pets", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://test.supabase.co/rest/v1/pets");
      const headers = new Headers(init.headers);
      expect(headers.get("Authorization")).toBe("Bearer test-token-123");
      expect(headers.get("Content-Type")).toBe("application/json");
    });

    it("should not add Authorization header for auth endpoints", async () => {
      mockFetch.mockResolvedValue(new Response());

      createSupabaseServerInstance({
        cookies: mockCookies,
        headers: mockHeaders,
        env: {},
        accessToken: "test-token-123",
      });

      const customFetch = getCustomFetch();
      expect(customFetch).toBeDefined();

      await customFetch!("https://test.supabase.co/auth/v1/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, init] = mockFetch.mock.calls[0];
      const headers = new Headers(init.headers);
      expect(headers.get("Authorization")).toBeNull();
      expect(headers.get("Content-Type")).toBe("application/json");
    });

    it("should merge existing headers with Authorization", async () => {
      mockFetch.mockResolvedValue(new Response());

      createSupabaseServerInstance({
        cookies: mockCookies,
        headers: mockHeaders,
        env: {},
        accessToken: "test-token-123",
      });

      const customFetch = getCustomFetch();
      expect(customFetch).toBeDefined();

      await customFetch!("https://test.supabase.co/rest/v1/pets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": "custom-value",
        },
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, init] = mockFetch.mock.calls[0];
      const headers = new Headers(init.headers);
      expect(headers.get("Authorization")).toBe("Bearer test-token-123");
      expect(headers.get("Content-Type")).toBe("application/json");
      expect(headers.get("X-Custom-Header")).toBe("custom-value");
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
