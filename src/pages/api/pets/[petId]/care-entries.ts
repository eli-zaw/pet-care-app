import type { APIRoute } from "astro";
import { z } from "zod";
import type {
  CreateCareEntryCommand,
  CreateCareEntryResponseDto,
  CareEntriesListQuery,
  CareEntriesListResponseDto,
  CareHistoryDto,
} from "../../../../types";

// Disable prerendering for API routes
export const prerender = false;

/**
 * Zod schema for petId validation
 * - petId: must be a valid UUID format
 */
const PetIdSchema = z.object({
  petId: z.string().uuid("Nieprawidłowy format ID zwierzęcia"),
});

/**
 * Zod schema for CreateCareEntryCommand validation
 * - category: enum (vet_visit, medication, grooming, food, health_event, note)
 * - entry_date: DATE string format YYYY-MM-DD (past/future allowed)
 * - note: optional string, max 1000 characters
 */
const CreateCareEntrySchema = z.object({
  category: z.enum(["vet_visit", "medication", "grooming", "food", "health_event", "note"], {
    errorMap: () => ({
      message: "Kategoria musi być jedną z: vet_visit, medication, grooming, food, health_event, note",
    }),
  }),
  entry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data musi być w formacie YYYY-MM-DD")
    .refine(
      (dateStr) => {
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
      },
      {
        message: "Nieprawidłowa data",
      }
    ),
  note: z.string().max(1000, "Notatka nie może być dłuższa niż 1000 znaków").optional().nullable(),
});

/**
 * Zod schema for CareEntriesListQuery validation
 * - page: optional number >= 1, default 1
 * - limit: optional number 1-100, default 20
 * - category: optional enum (vet_visit, medication, grooming, food, health_event, note)
 * - order: optional "asc" | "desc", default "desc"
 */
const CareEntriesListQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Numer strony musi być większy lub równy 1").default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit musi być większy lub równy 1")
    .max(100, "Limit nie może być większy niż 100")
    .default(20),
  category: z.enum(["vet_visit", "medication", "grooming", "food", "health_event", "note"]).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * POST /api/pets/:petId/care-entries
 * Creates a new care entry for the specified pet belonging to the logged-in user.
 * Supports 6 care categories (vet visits, medication, grooming, food, health events, notes)
 * with optional text field.
 *
 * Path params:
 * - petId (UUID): Pet identifier
 *
 * Request body:
 * - category (enum): vet_visit | medication | grooming | food | health_event | note
 * - entry_date (string YYYY-MM-DD): Entry date (past/future allowed)
 * - note (string, optional, max 1000 chars): Additional notes
 *
 * Returns:
 * - 201: Care entry created successfully with CreateCareEntryResponseDto
 * - 400: Invalid UUID, validation failed
 * - 401: No session (future; MVP skips this)
 * - 403: User is not the owner of the pet
 * - 404: Pet not found or is soft-deleted
 * - 500: Server error
 *
 * TODO: Add authentication once auth is implemented
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Get supabase client from context.locals
    const { supabase } = locals;

    // Step 1.5: Check if user is authenticated
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Użytkownik nie jest zalogowany",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Get authenticated user ID
    const userId = locals.user.id;

    // Step 2: Validate petId using Zod schema (UUID format)
    const petIdValidation = PetIdSchema.safeParse(params);

    if (!petIdValidation.success) {
      const errors = petIdValidation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation Failed",
          message: "Walidacja parametrów nie powiodła się",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { petId } = petIdValidation.data;

    // Step 3: Parse and validate request body using Zod schema
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
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const bodyValidation = CreateCareEntrySchema.safeParse(body);

    if (!bodyValidation.success) {
      const errors = bodyValidation.error.errors.map((err) => ({
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
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedData: CreateCareEntryCommand = bodyValidation.data;

    // Step 4: Verify pet exists and is not deleted
    const { data: pet, error: petCheckError } = await supabase
      .from("pets")
      .select("id, is_deleted")
      .eq("id", petId)
      .eq("is_deleted", false)
      .single();

    if (petCheckError || !pet) {
      // Pet doesn't exist or is deleted
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Zwierzę nie zostało znalezione",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 5: Verify user is the owner of the pet
    const { data: ownership, error: ownershipError } = await supabase
      .from("pet_owners")
      .select("pet_id")
      .eq("pet_id", petId)
      .eq("user_id", userId)
      .single();

    if (ownershipError || !ownership) {
      // User is not the owner
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Nie masz uprawnień do dodawania wpisów dla tego zwierzęcia",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 6: Insert care entry into database
    const { data: newEntry, error: insertError } = await supabase
      .from("care_entries")
      .insert({
        pet_id: petId,
        category: validatedData.category,
        entry_date: validatedData.entry_date,
        note: validatedData.note,
      })
      .select("id, pet_id, category, entry_date, note, created_at")
      .single();

    if (insertError) {
      console.error("Database error in POST /api/pets/:petId/care-entries (insert):", {
        error: insertError,
        userId,
        petId,
        validatedData,
      });

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Nie udało się utworzyć wpisu opieki",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!newEntry) {
      console.error("No entry data returned after insert");
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Nie udało się pobrać danych utworzonego wpisu",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Map category to display fields (category_display and category_emoji)
    const categoryMap: Record<string, { display: string; emoji: string }> = {
      vet_visit: { display: "Wizyta u weterynarza", emoji: "🏥" },
      medication: { display: "Leki i suplementy", emoji: "💊" },
      grooming: { display: "Groomer/fryzjer", emoji: "✂️" },
      food: { display: "Karma", emoji: "🍖" },
      health_event: { display: "Zdarzenie zdrowotne", emoji: "🩹" },
      note: { display: "Notatka", emoji: "📝" },
    };

    const categoryInfo = categoryMap[newEntry.category] || {
      display: newEntry.category,
      emoji: "❓",
    };

    // Build CreateCareEntryResponseDto
    const response: CreateCareEntryResponseDto = {
      id: newEntry.id,
      pet_id: newEntry.pet_id,
      category: newEntry.category,
      category_display: categoryInfo.display,
      category_emoji: categoryInfo.emoji,
      entry_date: newEntry.entry_date,
      note: newEntry.note,
      created_at: newEntry.created_at,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors for debugging
    console.error("Unexpected error in POST /api/pets/:petId/care-entries:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Wystąpił nieoczekiwany błąd serwera",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * GET /api/pets/:petId/care-entries
 * Returns paginated list of care entries for a specific pet.
 * Uses v_care_history view for enriched data (category_display, category_emoji, entry_date_formatted).
 * Returns only active entries (not deleted) for active pets.
 * Supports filtering by category and sorting by entry_date.
 *
 * Path params:
 * - petId (UUID): Pet identifier
 *
 * Query params:
 * - page (number, default 1): Page number
 * - limit (number, default 20, max 100): Items per page
 * - category (enum, optional): Filter by category
 * - order ("asc" | "desc", default "desc"): Sort order by entry_date, created_at
 *
 * Returns:
 * - 200: Paginated list of care entries with CareEntriesListResponseDto
 * - 400: Invalid query params
 * - 401: No session (future; MVP skips this)
 * - 403: Pet exists but belongs to another user
 * - 404: Pet not found or is deleted
 * - 500: Server error
 *
 * TODO: Add authentication once auth is implemented
 */
export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Get supabase client from context.locals
    const { supabase } = locals;

    // Step 1.5: Check if user is authenticated
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Użytkownik nie jest zalogowany",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Get authenticated user ID
    const userId = locals.user.id;

    // Step 2: Validate petId using Zod schema (UUID format)
    const petIdValidation = PetIdSchema.safeParse(params);

    if (!petIdValidation.success) {
      const errors = petIdValidation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation Failed",
          message: "Walidacja parametrów nie powiodła się",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { petId } = petIdValidation.data;

    // Step 3: Parse and validate query params using Zod schema
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      category: url.searchParams.get("category") || undefined,
      order: url.searchParams.get("order") || undefined,
    };

    const queryValidation = CareEntriesListQuerySchema.safeParse(queryParams);

    if (!queryValidation.success) {
      const errors = queryValidation.error.errors.map((err) => ({
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
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedQuery: CareEntriesListQuery = queryValidation.data;
    const page = validatedQuery.page || 1;
    const limit = validatedQuery.limit || 20;
    const order = validatedQuery.order || "desc";

    // Calculate pagination offset
    const offset = (page - 1) * limit;

    // Step 4: Verify pet exists, is active, and belongs to user
    // Check ownership first
    const { data: ownership, error: ownershipError } = await supabase
      .from("pet_owners")
      .select("pet_id")
      .eq("pet_id", petId)
      .eq("user_id", userId)
      .single();

    if (ownershipError || !ownership) {
      // Pet doesn't belong to user or doesn't exist
      // Check if pet exists at all to differentiate 403 from 404
      const { data: petExists } = await supabase.from("pets").select("id, is_deleted").eq("id", petId).single();

      if (petExists && !petExists.is_deleted) {
        // Pet exists and is active but belongs to another user
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "Nie masz uprawnień do przeglądania wpisów tego zwierzęcia",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Pet doesn't exist or is deleted (unified 404 for security)
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Zwierzę nie zostało znalezione",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify pet is not deleted
    const { data: pet, error: petCheckError } = await supabase
      .from("pets")
      .select("id, is_deleted")
      .eq("id", petId)
      .eq("is_deleted", false)
      .single();

    if (petCheckError || !pet) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Zwierzę nie zostało znalezione",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 5: Query v_care_history with filtering and sorting
    // Build query with filters
    let entriesQuery = supabase
      .from("v_care_history")
      .select(
        `
        id,
        pet_id,
        category,
        category_display,
        category_emoji,
        entry_date,
        entry_date_formatted,
        note,
        note_preview,
        has_more,
        created_at,
        updated_at
      `
      )
      .eq("pet_id", petId);

    // Apply category filter if provided
    if (validatedQuery.category) {
      entriesQuery = entriesQuery.eq("category", validatedQuery.category);
    }

    // Apply sorting: entry_date [order], created_at [order]
    entriesQuery = entriesQuery.order("entry_date", { ascending: order === "asc" });
    entriesQuery = entriesQuery.order("created_at", { ascending: order === "asc" });

    // Apply pagination
    entriesQuery = entriesQuery.range(offset, offset + limit - 1);

    const { data: entriesData, error: queryError } = await entriesQuery;

    if (queryError) {
      console.error("Database error in GET /api/pets/:petId/care-entries (query):", {
        error: queryError,
        userId,
        petId,
        query: validatedQuery,
      });

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Nie udało się pobrać listy wpisów opieki",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 6: Execute separate count query for total
    let countQuery = supabase.from("v_care_history").select("id", { count: "exact", head: true }).eq("pet_id", petId);

    // Apply same category filter as main query
    if (validatedQuery.category) {
      countQuery = countQuery.eq("category", validatedQuery.category);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error("Database error in GET /api/pets/:petId/care-entries (count):", {
        error: countError,
        userId,
        petId,
      });

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Nie udało się pobrać liczby wpisów opieki",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Map results to CareHistoryDto[]
    // View already provides all required fields including note_preview and has_more
    const items: CareHistoryDto[] = (entriesData || [])
      .filter(
        (entry) =>
          entry.id !== null &&
          entry.pet_id !== null &&
          entry.category !== null &&
          entry.category_display !== null &&
          entry.category_emoji !== null &&
          entry.entry_date !== null &&
          entry.entry_date_formatted !== null &&
          entry.created_at !== null &&
          entry.updated_at !== null
      )
      .map((entry) => ({
        id: entry.id as string,
        pet_id: entry.pet_id as string,
        category: entry.category as NonNullable<typeof entry.category>,
        category_display: entry.category_display as string,
        category_emoji: entry.category_emoji as string,
        entry_date: entry.entry_date as string,
        entry_date_formatted: entry.entry_date_formatted as string,
        note: entry.note,
        note_preview: entry.note_preview,
        has_more: entry.has_more,
        created_at: entry.created_at as string,
        updated_at: entry.updated_at as string,
      }));

    const response: CareEntriesListResponseDto = {
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
    console.error("Unexpected error in GET /api/pets/:petId/care-entries:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Wystąpił nieoczekiwany błąd serwera",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
