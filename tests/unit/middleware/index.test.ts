import { describe, it, expect, vi, beforeEach } from "vitest";
import { onRequest } from "../../../../src/middleware/index";

// Mock Supabase client
vi.mock("../../../../src/db/supabase.client", () => ({
  createSupabaseServerInstance: vi.fn(),
}));

import { createSupabaseServerInstance } from "../../../../src/db/supabase.client";

describe("Middleware onRequest", () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
  } as const;

  const mockNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSupabaseServerInstance).mockReturnValue(mockSupabase);
  });

  describe("Authentication flow", () => {
    it("should redirect to /login for protected routes when not authenticated", async () => {
      // No auth cookies
      const context = {
        locals: {},
        cookies: { getAll: vi.fn().mockReturnValue([]) },
        url: new URL("http://localhost:3000/dashboard"),
        request: {
          headers: { get: vi.fn().mockReturnValue("") },
        },
        redirect: vi.fn(),
      };

      await onRequest(context, mockNext);

      expect(context.redirect).toHaveBeenCalledWith("/login?redirect=%2Fdashboard");
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should allow access to auth routes when not authenticated", async () => {
      const context = {
        locals: {},
        cookies: { getAll: vi.fn().mockReturnValue([]) },
        url: new URL("http://localhost:3000/login"),
        request: {
          headers: { get: vi.fn().mockReturnValue("") },
        },
        redirect: vi.fn(),
      };

      await onRequest(context, mockNext);

      expect(context.redirect).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should set user context when authenticated", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const mockSession = { access_token: "token-123" };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession } });

      // Mock auth cookies present
      const context = {
        locals: {},
        cookies: {
          getAll: vi.fn().mockReturnValue([{ name: "sb-project-auth-token", value: "token" }]),
        },
        url: new URL("http://localhost:3000/dashboard"),
        request: {
          headers: { get: vi.fn().mockReturnValue("") },
        },
        redirect: vi.fn(),
      };

      await onRequest(context, mockNext);

      expect(context.locals.user).toEqual({ email: "test@example.com", id: "user-123" });
      expect(context.locals.supabase).toBeDefined();
      expect(createSupabaseServerInstance).toHaveBeenCalledWith({
        cookies: context.cookies,
        headers: context.request.headers,
        env: {
          SUPABASE_URL: undefined,
          SUPABASE_KEY: undefined,
          DEBUG_ERRORS: undefined,
        },
        accessToken: "token-123",
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it("should redirect authenticated users away from auth routes", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const context = {
        locals: {},
        cookies: {
          getAll: vi.fn().mockReturnValue([{ name: "sb-project-auth-token", value: "token" }]),
        },
        url: new URL("http://localhost:3000/login"),
        request: {
          headers: { get: vi.fn().mockReturnValue("") },
        },
        redirect: vi.fn(),
      };

      await onRequest(context, mockNext);

      expect(context.redirect).toHaveBeenCalledWith("/dashboard");
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should continue with empty user context on auth error", async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error("Auth error"));

      const context = {
        locals: {},
        cookies: {
          getAll: vi.fn().mockReturnValue([{ name: "sb-project-auth-token", value: "token" }]),
        },
        url: new URL("http://localhost:3000/dashboard"),
        request: {
          headers: { get: vi.fn().mockReturnValue("") },
        },
        redirect: vi.fn(),
      };

      await onRequest(context, mockNext);

      expect(context.locals.user).toBeNull();
      expect(context.locals.supabase).toBeDefined(); // Still sets basic client
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("Cookie detection", () => {
    it("should detect Supabase auth cookies correctly", async () => {
      const context = {
        locals: {},
        cookies: {
          getAll: vi.fn().mockReturnValue([{ name: "sb-project-auth-token", value: "token" }]),
        },
        url: new URL("http://localhost:3000/dashboard"),
        request: {
          headers: { get: vi.fn().mockReturnValue("") },
        },
        redirect: vi.fn(),
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await onRequest(context, mockNext);

      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    });

    it("should skip auth check when no Supabase cookies", async () => {
      const context = {
        locals: {},
        cookies: {
          getAll: vi.fn().mockReturnValue([{ name: "other-cookie", value: "value" }]),
        },
        url: new URL("http://localhost:3000/dashboard"),
        request: {
          headers: { get: vi.fn().mockReturnValue("") },
        },
        redirect: vi.fn(),
      };

      await onRequest(context, mockNext);

      expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
      expect(context.locals.user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
