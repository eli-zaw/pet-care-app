import type { APIRoute } from "astro";
import { z } from "zod";
import type { CareEntryDto, UpdateCareEntryCommand, UpdateCareEntryResponseDto } from "../../../../../types";
import { DEFAULT_USER_ID } from "../../../../../db/supabase.client";

// Disable prerendering for API routes
export const prerender = false;

/**
 * Zod schema for petId and entryId validation
 * - petId: must be a valid UUID format
 * - entryId: must be a valid UUID format
 */
const ParamsSchema = z.object({
  petId: z.string().uuid("Nieprawidłowy format ID zwierzęcia"),
  entryId: z.string().uuid("Nieprawidłowy format ID wpisu opieki"),
});

/**
 * Zod schema for UpdateCareEntryCommand validation
 * - category: optional enum (vet_visit, medication, grooming, food, health_event, note)
 * - entry_date: optional DATE string format YYYY-MM-DD
 * - note: optional string max 1000 characters or null
 * At least one field must be provided
 */
const UpdateCareEntrySchema = z
  .object({
    category: z.enum(["vet_visit", "medication", "grooming", "food", "health_event", "note"]).optional(),
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
      )
      .optional(),
    note: z.string().max(1000, "Notatka nie może być dłuższa niż 1000 znaków").optional().nullable(),
  })
  .refine(
    (data) => {
      // Ensure at least one field is provided
      return data.category !== undefined || data.entry_date !== undefined || data.note !== undefined;
    },
    {
      message: "Musisz podać co najmniej jedno pole do aktualizacji",
    }
  );

/**
 * GET /api/pets/:petId/care-entries/:entryId
 * Returns data for a single care entry.
 * Returns only active entries (not deleted) for active pets belonging to the user.
 * Used primarily for filling edit form.
 *
 * Path params:
 * - petId (UUID): Pet identifier
 * - entryId (UUID): Care entry identifier
 *
 * Returns:
 * - 200: Care entry data with CareEntryDto + display fields
 * - 400: Invalid UUID format
 * - 401: No session (future; MVP skips this)
 * - 403: Pet exists but belongs to another user
 * - 404: Pet not found/deleted OR entry not found/deleted OR entry doesn't belong to pet
 * - 500: Server error
 *
 * TODO: Add authentication once auth is implemented
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Get supabase client from context.locals
    const { supabase } = locals;

    // TODO: Replace with authenticated user ID once auth is implemented
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate petId and entryId using Zod schema (UUID format)
    const validationResult = ParamsSchema.safeParse(params);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
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

    const { petId, entryId } = validationResult.data;

    // Step 3: User session check (MVP uses DEFAULT_USER_ID)
    // TODO: In production, verify user session here and return 401 if not authenticated

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

    // Step 5: Query care entry by id, pet_id, is_deleted = false
    const { data: entryData, error: entryError } = await supabase
      .from("care_entries")
      .select("id, pet_id, category, entry_date, note, created_at, updated_at")
      .eq("id", entryId)
      .eq("pet_id", petId)
      .eq("is_deleted", false)
      .single();

    if (entryError || !entryData) {
      // Entry not found, deleted, or doesn't belong to this pet
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Wpis opieki nie został znaleziony",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 6: Map category to display fields (category_display and category_emoji)
    const categoryMap: Record<string, { display: string; emoji: string }> = {
      vet_visit: { display: "Wizyta u weterynarza", emoji: "🏥" },
      medication: { display: "Leki i suplementy", emoji: "💊" },
      grooming: { display: "Groomer/fryzjer", emoji: "✂️" },
      food: { display: "Karma", emoji: "🍖" },
      health_event: { display: "Zdarzenie zdrowotne", emoji: "🩹" },
      note: { display: "Notatka", emoji: "📝" },
    };

    const categoryInfo = categoryMap[entryData.category] || {
      display: entryData.category,
      emoji: "❓",
    };

    // Build response with CareEntryDto + display fields
    const response: CareEntryDto & { category_display: string; category_emoji: string } = {
      id: entryData.id,
      pet_id: entryData.pet_id,
      category: entryData.category,
      category_display: categoryInfo.display,
      category_emoji: categoryInfo.emoji,
      entry_date: entryData.entry_date,
      note: entryData.note,
      created_at: entryData.created_at,
      updated_at: entryData.updated_at,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors for debugging
    console.error("Unexpected error in GET /api/pets/:petId/care-entries/:entryId:", error);

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
 * PATCH /api/pets/:petId/care-entries/:entryId
 * Updates an existing care entry for a specific pet.
 * All fields are optional - can update category, entry_date, or note independently.
 * Requires ownership verification via pet_owners. Auto-sets updated_at via DB trigger.
 *
 * Path params:
 * - petId (UUID): Pet identifier
 * - entryId (UUID): Care entry identifier
 *
 * Request body (all optional, at least one required):
 * - category (enum, optional): vet_visit | medication | grooming | food | health_event | note
 * - entry_date (string YYYY-MM-DD, optional): Entry date
 * - note (string, optional, max 1000 chars or null): Notes
 *
 * Returns:
 * - 200: Updated care entry with UpdateCareEntryResponseDto
 * - 400: Invalid UUID, validation failed, or empty body
 * - 401: No session (future; MVP skips this)
 * - 403: User is not the owner of the pet
 * - 404: Pet/entry not found, deleted, or entry doesn't belong to pet
 * - 500: Server error
 *
 * TODO: Add authentication once auth is implemented
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Get supabase client from context.locals
    const { supabase } = locals;

    // TODO: Replace with authenticated user ID once auth is implemented
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate petId and entryId using Zod schema (UUID format)
    const paramsValidation = ParamsSchema.safeParse(params);

    if (!paramsValidation.success) {
      const errors = paramsValidation.error.errors.map((err) => ({
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

    const { petId, entryId } = paramsValidation.data;

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

    const bodyValidation = UpdateCareEntrySchema.safeParse(body);

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

    const updateData: UpdateCareEntryCommand = bodyValidation.data;

    // Step 4: Verify entry exists, is active, and belongs to pet
    const { data: entryCheck, error: entryCheckError } = await supabase
      .from("care_entries")
      .select("id, pet_id, is_deleted")
      .eq("id", entryId)
      .eq("pet_id", petId)
      .eq("is_deleted", false)
      .single();

    if (entryCheckError || !entryCheck) {
      // Entry not found, deleted, or doesn't belong to this pet
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Wpis opieki nie został znaleziony",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify user is the owner of the pet
    const { data: ownership, error: ownershipError } = await supabase
      .from("pet_owners")
      .select("pet_id")
      .eq("pet_id", petId)
      .eq("user_id", userId)
      .single();

    if (ownershipError || !ownership) {
      // User is not the owner of the pet
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Nie masz uprawnień do edycji wpisów tego zwierzęcia",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 5: Execute UPDATE for provided fields only
    // Build update object with only provided fields
    const updatePayload: UpdateCareEntryCommand = {};

    if (updateData.category !== undefined) {
      updatePayload.category = updateData.category;
    }
    if (updateData.entry_date !== undefined) {
      updatePayload.entry_date = updateData.entry_date;
    }
    if (updateData.note !== undefined) {
      updatePayload.note = updateData.note;
    }

    const { error: updateError } = await supabase.from("care_entries").update(updatePayload).eq("id", entryId);

    if (updateError) {
      console.error("Database error in PATCH /api/pets/:petId/care-entries/:entryId (update):", {
        error: updateError,
        userId,
        petId,
        entryId,
        updateData,
      });

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Nie udało się zaktualizować wpisu opieki",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 6: Fetch updated entry data
    const { data: updatedEntry, error: fetchError } = await supabase
      .from("care_entries")
      .select("id, pet_id, category, entry_date, note, created_at, updated_at")
      .eq("id", entryId)
      .single();

    if (fetchError || !updatedEntry) {
      console.error("Error fetching updated entry:", fetchError);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Nie udało się pobrać zaktualizowanych danych wpisu",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Map category to display fields
    const categoryMap: Record<string, { display: string; emoji: string }> = {
      vet_visit: { display: "Wizyta u weterynarza", emoji: "🏥" },
      medication: { display: "Leki i suplementy", emoji: "💊" },
      grooming: { display: "Groomer/fryzjer", emoji: "✂️" },
      food: { display: "Karma", emoji: "🍖" },
      health_event: { display: "Zdarzenie zdrowotne", emoji: "🩹" },
      note: { display: "Notatka", emoji: "📝" },
    };

    const categoryInfo = categoryMap[updatedEntry.category] || {
      display: updatedEntry.category,
      emoji: "❓",
    };

    // Build UpdateCareEntryResponseDto
    const response: UpdateCareEntryResponseDto = {
      id: updatedEntry.id,
      pet_id: updatedEntry.pet_id,
      category: updatedEntry.category,
      category_display: categoryInfo.display,
      category_emoji: categoryInfo.emoji,
      entry_date: updatedEntry.entry_date,
      note: updatedEntry.note,
      created_at: updatedEntry.created_at,
      updated_at: updatedEntry.updated_at,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors for debugging
    console.error("Unexpected error in PATCH /api/pets/:petId/care-entries/:entryId:", error);

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
 * DELETE /api/pets/:petId/care-entries/:entryId
 * Performs soft delete of a care entry (sets is_deleted = true, deleted_at = NOW()).
 * Requires ownership verification via pet_owners. Auto-sets updated_at via DB trigger.
 *
 * Path params:
 * - petId (UUID): Pet identifier
 * - entryId (UUID): Care entry identifier
 *
 * Returns:
 * - 204: Entry deleted successfully (no body)
 * - 400: Invalid UUID format
 * - 401: No session (future; MVP skips this)
 * - 403: User is not the owner of the pet
 * - 404: Pet/entry not found, deleted, or entry doesn't belong to pet
 * - 500: Server error
 *
 * TODO: Add authentication once auth is implemented
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Get supabase client from context.locals
    const { supabase } = locals;

    // TODO: Replace with authenticated user ID once auth is implemented
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate petId and entryId using Zod schema (UUID format)
    const paramsValidation = ParamsSchema.safeParse(params);

    if (!paramsValidation.success) {
      const errors = paramsValidation.error.errors.map((err) => ({
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

    const { petId, entryId } = paramsValidation.data;

    // Step 3: User session check (MVP uses DEFAULT_USER_ID)
    // TODO: In production, verify user session here and return 401 if not authenticated

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
            message: "Nie masz uprawnień do usuwania wpisów tego zwierzęcia",
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

    // Step 5: Verify entry exists, is active, and belongs to pet
    const { data: entryCheck, error: entryCheckError } = await supabase
      .from("care_entries")
      .select("id, pet_id, is_deleted")
      .eq("id", entryId)
      .eq("pet_id", petId)
      .eq("is_deleted", false)
      .single();

    if (entryCheckError || !entryCheck) {
      // Entry not found, deleted, or doesn't belong to this pet (unified 404)
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Wpis opieki nie został znaleziony",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 6: Execute soft delete (set is_deleted = true, deleted_at = NOW())
    const { error: deleteError } = await supabase
      .from("care_entries")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", entryId);

    if (deleteError) {
      console.error("Database error in DELETE /api/pets/:petId/care-entries/:entryId (soft delete):", {
        error: deleteError,
        userId,
        petId,
        entryId,
      });

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Nie udało się usunąć wpisu opieki",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 7: Return 204 No Content (no body)
    return new Response(null, { status: 204 });
  } catch (error) {
    // Log unexpected errors for debugging
    console.error("Unexpected error in DELETE /api/pets/:petId/care-entries/:entryId:", error);

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
