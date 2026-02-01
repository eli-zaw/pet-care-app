import type { APIRoute } from "astro";
import { z } from "zod";
import type {
  CreatePetCommand,
  CreatePetResponseDto,
  PetsListQuery,
  PetsListResponseDto,
  PetSummaryDto,
} from "../../types";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/pets
 * Returns a paginated list of pets owned by the current user (uses DEFAULT_USER_ID for now).
 * Uses v_pets_summary view for enriched data (species_display, species_emoji, entries_count).
 *
 * Query params:
 * - page (number, default 1): Page number
 * - limit (number, default 20, max 100): Items per page
 * - include (string, "summary", optional): Use view with additional data
 *
 * Returns:
 * - 200: Paginated list of pets with PetsListResponseDto
 * - 400: Invalid query params
 * - 401: No session (future; MVP skips this)
 * - 500: Server error
 *
 * TODO: Add authentication once auth is implemented
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Use the Supabase client from middleware (it already has accessToken for RLS)
    const { supabase } = locals;

    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: "Internal Error",
          message: "Supabase client nie został zainicjalizowany",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" } as Record<string, string>,
        }
      );
    }

    // Step 1.5: Check if user is authenticated
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Użytkownik nie jest zalogowany",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" } as Record<string, string>,
        }
      );
    }

    // Step 2: Get authenticated user ID
    const userId = locals.user.id;

    // Step 2: Parse and validate query params using Zod schema
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      include: url.searchParams.get("include") || undefined,
    };

    const validationResult = PetsListQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation Failed",
          message: "Walidacja parametrów zapytania nie powiodła się",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" } as Record<string, string>,
        }
      );
    }

    const validatedQuery: PetsListQuery = validationResult.data;
    const page = validatedQuery.page || 1;
    const limit = validatedQuery.limit || 20;

    // Step 3: Calculate pagination offset
    const offset = (page - 1) * limit;

    // Step 4: First, get pet IDs owned by the user from pet_owners table
    const { data: ownedPets, error: ownershipError } = await supabase
      .from("pet_owners")
      .select("pet_id")
      .eq("user_id", userId);

    if (ownershipError) {
      console.error("Database error in GET /api/pets (ownership check):", {
        error: ownershipError,
        userId,
      });

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Nie udało się pobrać listy zwierząt",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" } as Record<string, string>,
        }
      );
    }

    // Extract pet IDs owned by the user
    const petIds = ownedPets?.map((po) => po.pet_id) || [];

    // If user has no pets, return empty list early
    if (petIds.length === 0) {
      const emptyResponse: PetsListResponseDto = {
        items: [],
        pagination: {
          page,
          limit,
          total: 0,
        },
      };

      return new Response(JSON.stringify(emptyResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" } as Record<string, string>,
      });
    }

    // Step 5: Query v_pets_summary view filtering by owned pet IDs
    // Apply pagination and ordering
    // Note: v_pets_summary already filters is_deleted = false
    const { data: petsData, error: queryError } = await supabase
      .from("v_pets_summary")
      .select(
        `
        id,
        animal_code,
        name,
        species,
        species_display,
        species_emoji,
        entries_count,
        created_at,
        updated_at
      `
      )
      .in("id", petIds)
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (queryError) {
      console.error("Database error in GET /api/pets (query):", {
        error: queryError,
        userId,
        page,
        limit,
      });

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Nie udało się pobrać listy zwierząt",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" } as Record<string, string>,
        }
      );
    }

    // Step 6: Execute separate count query for total
    // Use the same filters as main query
    const { count: totalCount, error: countError } = await supabase
      .from("v_pets_summary")
      .select("id", { count: "exact", head: true })
      .in("id", petIds);

    if (countError) {
      console.error("Database error in GET /api/pets (count):", {
        error: countError,
        userId,
      });

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Nie udało się pobrać liczby zwierząt",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" } as Record<string, string>,
        }
      );
    }

    // Step 7: Map results to PetsListResponseDto
    // Filter out any invalid records (shouldn't happen but TypeScript safety)
    const items: PetSummaryDto[] = (petsData || [])
      .filter(
        (pet) =>
          pet.id !== null &&
          pet.animal_code !== null &&
          pet.name !== null &&
          pet.species !== null &&
          pet.species_display !== null &&
          pet.species_emoji !== null &&
          pet.created_at !== null &&
          pet.updated_at !== null
      )
      .map((pet) => ({
        id: pet.id as string,
        animal_code: pet.animal_code as string,
        name: pet.name as string,
        species: pet.species as NonNullable<typeof pet.species>,
        species_display: pet.species_display as string,
        species_emoji: pet.species_emoji as string,
        entries_count: pet.entries_count || 0,
        created_at: pet.created_at as string,
        updated_at: pet.updated_at as string,
      }));

    const response: PetsListResponseDto = {
      items,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors for debugging
    console.error("Unexpected error in GET /api/pets:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Wystąpił nieoczekiwany błąd serwera",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" } as Record<string, string>,
      }
    );
  }
};

/**
 * Zod schema for CreatePetCommand validation
 * - name: trimmed string, 1-50 characters
 * - species: enum (dog, cat, other)
 */
const CreatePetSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Imię zwierzęcia jest wymagane")
    .max(50, "Imię zwierzęcia nie może być dłuższe niż 50 znaków"),
  species: z.enum(["dog", "cat", "other"], {
    errorMap: () => ({ message: "Gatunek musi być jednym z: dog, cat, other" }),
  }),
});

/**
 * Zod schema for PetsListQuery validation
 * - page: optional number >= 1, default 1
 * - limit: optional number 1-100, default 20
 * - include: optional string "summary"
 */
const PetsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Numer strony musi być większy lub równy 1").default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit musi być większy lub równy 1")
    .max(100, "Limit nie może być większy niż 100")
    .default(20),
  include: z.enum(["summary"]).optional(),
});

/**
 * POST /api/pets
 * Creates a new pet for the current user (uses DEFAULT_USER_ID for now).
 *
 * Request body: { name: string, species: "dog" | "cat" | "other" }
 *
 * Returns:
 * - 201: Pet created successfully with CreatePetResponseDto
 * - 400: Validation failed
 * - 409: Pet name already exists for this user
 * - 500: Server error
 *
 * TODO: Add authentication once auth is implemented
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Use the Supabase client from middleware (it already has accessToken for RLS)
    const { supabase } = locals;

    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: "Internal Error",
          message: "Supabase client nie został zainicjalizowany",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" } as Record<string, string>,
        }
      );
    }

    // DEBUG: Check if session is available and decode JWT claims
    const {
      data: { session },
    } = await supabase.auth.getSession();

    let jwtClaims: Record<string, unknown> | null = null;
    if (session?.access_token) {
      try {
        // Decode JWT payload (it's base64url encoded, middle part between dots)
        const parts = session.access_token.split(".");
        if (parts.length === 3) {
          const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          jwtClaims = JSON.parse(atob(payload));
        }
      } catch (e) {
        console.error("Failed to decode JWT:", e);
      }
    }

    console.log("POST /api/pets - Session check:", {
      hasSession: !!session,
      userId: session?.user?.id,
      accessTokenPresent: !!session?.access_token,
      accessTokenLength: session?.access_token?.length,
      jwtClaims: jwtClaims
        ? {
            sub: jwtClaims.sub,
            role: jwtClaims.role,
            aud: jwtClaims.aud,
            exp: jwtClaims.exp,
            expiredAt: jwtClaims.exp ? new Date(jwtClaims.exp * 1000).toISOString() : null,
            isExpired: jwtClaims.exp ? Date.now() > jwtClaims.exp * 1000 : null,
          }
        : null,
    });

    // Step 1.5: Check if user is authenticated
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Użytkownik nie jest zalogowany",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" } as Record<string, string>,
        }
      );
    }

    // Step 2: Get authenticated user ID
    const userId = locals.user.id;

    console.log(userId);

    // Step 2: Parse and validate request body using Zod schema
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Nieprawidłowy format JSON",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const validationResult = CreatePetSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation Failed",
          message: "Walidacja danych wejściowych nie powiodła się",
          details: errors,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const validatedData: CreatePetCommand = validationResult.data;

    // Step 3.5: Check if pet with same name already exists for this user
    // (active pets only, case-insensitive)
    const { data: existingPets, error: checkError } = await supabase
      .from("pets")
      .select("id, name")
      .eq("is_deleted", false)
      .ilike("name", validatedData.name.trim())
      .limit(1);

    if (checkError) {
      console.error("Error checking for existing pet:", checkError);
      // Continue anyway - we'll catch duplicate errors from DB if they occur
    }

    if (existingPets && existingPets.length > 0) {
      // Check if this pet belongs to the current user
      const { data: ownership } = await supabase
        .from("pet_owners")
        .select("pet_id")
        .eq("pet_id", existingPets[0].id)
        .eq("user_id", userId)
        .single();

      if (ownership) {
        return new Response(
          JSON.stringify({
            error: "Conflict",
            message: `Zwierzę o imieniu "${validatedData.name}" już istnieje w Twoim profilu`,
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" } as Record<string, string>,
          }
        );
      }
    }

    // Step 4: Insert pet into database with validated data
    // Use .select() to return fields required for CreatePetResponseDto
    // Note: animal_code is set to empty string, trigger will generate unique code
    const { data: newPet, error: insertError } = await supabase
      .from("pets")
      .insert({
        name: validatedData.name,
        species: validatedData.species,
        animal_code: "", // Trigger will generate unique code
      })
      .select("id, animal_code, name, species, created_at")
      .single();

    // Step 5: Map database errors to HTTP status codes
    if (insertError) {
      console.error("Database error in POST /api/pets:", {
        error: insertError,
        userId,
        payload: validatedData,
      });

      // Generic database error (409 is handled above at application level)
      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Nie udało się utworzyć zwierzęcia",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" } as Record<string, string>,
        }
      );
    }

    // Ensure we have the pet data
    if (!newPet) {
      console.error("No pet data returned after insert");
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Nie udało się pobrać danych utworzonego zwierzęcia",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" } as Record<string, string>,
        }
      );
    }

    // Step 6: Return CreatePetResponseDto with 201 status
    const response: CreatePetResponseDto = {
      id: newPet.id,
      animal_code: newPet.animal_code,
      name: newPet.name,
      species: newPet.species,
      created_at: newPet.created_at,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors for debugging
    console.error("Unexpected error in POST /api/pets:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Wystąpił nieoczekiwany błąd serwera",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" } as Record<string, string>,
      }
    );
  }
};
