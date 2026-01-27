import type { APIRoute } from "astro";
import { z } from "zod";
import type { GetPetResponseDto } from "../../../types";

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
 * Zod schema for UpdatePetCommand validation
 * - name: optional trimmed string, 1-50 characters
 * - species: forbidden (immutable after creation)
 */
const UpdatePetSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Imię zwierzęcia musi mieć co najmniej 1 znak")
      .max(50, "Imię zwierzęcia nie może być dłuższe niż 50 znaków")
      .optional(),
  })
  .strict()
  .refine(
    (data) => {
      // Ensure at least one field is provided
      return data.name !== undefined;
    },
    {
      message: "Musisz podać co najmniej jedno pole do aktualizacji",
    }
  );

/**
 * GET /api/pets/:petId
 * Returns basic information about a single pet by its unique identifier (UUID).
 * Returns only active pets (not deleted) that belong to the currently logged-in user.
 *
 * Path params:
 * - petId (UUID): Pet identifier
 *
 * Returns:
 * - 200: Pet data with GetPetResponseDto
 * - 400: Invalid UUID format
 * - 401: No session (future; MVP skips this)
 * - 404: Pet not found, doesn't belong to user, or is deleted
 * - 500: Server error
 *
 * TODO: Add authentication once auth is implemented
 */
export const GET: APIRoute = async ({ params, locals }) => {
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
    const validationResult = PetIdSchema.safeParse(params);

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

    const { petId } = validationResult.data;

    // Step 3: User session check (MVP uses DEFAULT_USER_ID)
    // TODO: In production, verify user session here and return 401 if not authenticated

    // Step 4: Check if pet belongs to the user via pet_owners table
    const { data: ownership, error: ownershipError } = await supabase
      .from("pet_owners")
      .select("pet_id")
      .eq("pet_id", petId)
      .eq("user_id", userId)
      .single();

    if (ownershipError || !ownership) {
      // Return 404 for security reasons (don't reveal if pet exists but belongs to someone else)
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

    // Step 5: Query v_pets_summary for pet data with display fields
    // Filter by petId and is_deleted = false (view already filters is_deleted)
    const { data: petData, error: queryError } = await supabase
      .from("v_pets_summary")
      .select(
        `
        id,
        animal_code,
        name,
        species,
        species_display,
        species_emoji,
        created_at,
        updated_at
      `
      )
      .eq("id", petId)
      .single();

    if (queryError || !petData) {
      console.error("Database error in GET /api/pets/:petId (query):", {
        error: queryError,
        userId,
        petId,
      });

      // Pet was in pet_owners but not found in view - likely deleted
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

    // Step 6: Map result to GetPetResponseDto and return 200
    // Filter and validate required fields
    if (
      !petData.id ||
      !petData.animal_code ||
      !petData.name ||
      !petData.species ||
      !petData.species_display ||
      !petData.species_emoji ||
      !petData.created_at ||
      !petData.updated_at
    ) {
      console.error("Incomplete pet data from view:", {
        petId,
        petData,
      });

      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Niepełne dane zwierzęcia",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const response: GetPetResponseDto = {
      id: petData.id,
      animal_code: petData.animal_code,
      name: petData.name,
      species: petData.species,
      species_display: petData.species_display,
      species_emoji: petData.species_emoji,
      created_at: petData.created_at,
      updated_at: petData.updated_at,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors for debugging
    console.error("Unexpected error in GET /api/pets/:petId:", error);

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
 * PATCH /api/pets/:petId
 * Updates pet data for the logged-in user.
 * Only allows changing the name field - species is immutable after creation.
 * All fields in body are optional (partial update).
 *
 * Path params:
 * - petId (UUID): Pet identifier
 *
 * Request body (all fields optional):
 * - name (string, 1-50 characters after trim)
 * Note: species is immutable - attempting to change it will return 400
 *
 * Returns:
 * - 200: Updated pet data with GetPetResponseDto
 * - 400: Invalid UUID, validation failed, or attempt to change species
 * - 401: No session (future; MVP skips this)
 * - 403: Pet exists but belongs to another user
 * - 404: Pet not found or is deleted
 * - 409: Name already taken for another active pet of this user
 * - 500: Server error
 *
 * TODO: Add authentication once auth is implemented
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
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

    // Check if species is in the body (immutable field)
    if (body && typeof body === "object" && "species" in body) {
      return new Response(
        JSON.stringify({
          error: "Validation Failed",
          message: "Pole 'species' nie może być zmienione po utworzeniu zwierzęcia",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const bodyValidation = UpdatePetSchema.safeParse(body);

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

    const updateData = bodyValidation.data;

    // Step 4: Check if pet exists, is active, and belongs to user
    // First check ownership
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
            message: "Nie masz uprawnień do edycji tego zwierzęcia",
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
    const { data: currentPet, error: petCheckError } = await supabase
      .from("pets")
      .select("id, name, is_deleted")
      .eq("id", petId)
      .eq("is_deleted", false)
      .single();

    if (petCheckError || !currentPet) {
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

    // Step 5: Check name uniqueness if name is being changed
    if (updateData.name && updateData.name !== currentPet.name) {
      // Check if another active pet of this user has this name (case-insensitive)
      const { data: existingPets, error: checkError } = await supabase
        .from("pets")
        .select("id, name")
        .eq("is_deleted", false)
        .ilike("name", updateData.name.trim())
        .neq("id", petId)
        .limit(1);

      if (checkError) {
        console.error("Error checking for existing pet name:", checkError);
        return new Response(
          JSON.stringify({
            error: "Database Error",
            message: "Nie udało się sprawdzić unikalności nazwy",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (existingPets && existingPets.length > 0) {
        // Check if this pet belongs to the current user
        const { data: conflictOwnership } = await supabase
          .from("pet_owners")
          .select("pet_id")
          .eq("pet_id", existingPets[0].id)
          .eq("user_id", userId)
          .single();

        if (conflictOwnership) {
          return new Response(
            JSON.stringify({
              error: "Conflict",
              message: `Zwierzę o imieniu "${updateData.name}" już istnieje w Twoim profilu`,
            }),
            {
              status: 409,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    // Step 6: Execute UPDATE if name is provided
    if (updateData.name) {
      const { error: updateError } = await supabase.from("pets").update({ name: updateData.name }).eq("id", petId);

      if (updateError) {
        console.error("Database error in PATCH /api/pets/:petId (update):", {
          error: updateError,
          userId,
          petId,
          updateData,
        });

        return new Response(
          JSON.stringify({
            error: "Database Error",
            message: "Nie udało się zaktualizować zwierzęcia",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Fetch updated pet data from v_pets_summary
    const { data: updatedPetData, error: fetchError } = await supabase
      .from("v_pets_summary")
      .select(
        `
        id,
        animal_code,
        name,
        species,
        species_display,
        species_emoji,
        created_at,
        updated_at
      `
      )
      .eq("id", petId)
      .single();

    if (fetchError || !updatedPetData) {
      console.error("Error fetching updated pet data:", fetchError);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Nie udało się pobrać zaktualizowanych danych zwierzęcia",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate required fields
    if (
      !updatedPetData.id ||
      !updatedPetData.animal_code ||
      !updatedPetData.name ||
      !updatedPetData.species ||
      !updatedPetData.species_display ||
      !updatedPetData.species_emoji ||
      !updatedPetData.created_at ||
      !updatedPetData.updated_at
    ) {
      console.error("Incomplete updated pet data from view:", {
        petId,
        updatedPetData,
      });

      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Niepełne dane zaktualizowanego zwierzęcia",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const response: GetPetResponseDto = {
      id: updatedPetData.id,
      animal_code: updatedPetData.animal_code,
      name: updatedPetData.name,
      species: updatedPetData.species,
      species_display: updatedPetData.species_display,
      species_emoji: updatedPetData.species_emoji,
      created_at: updatedPetData.created_at,
      updated_at: updatedPetData.updated_at,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors for debugging
    console.error("Unexpected error in PATCH /api/pets/:petId:", error);

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
 * DELETE /api/pets/:petId
 * Performs soft delete of a pet (sets is_deleted = true and deleted_at = NOW()).
 * Database trigger automatically cascades soft delete to all related care_entries.
 * Physical data remains in database but is invisible in API.
 *
 * Path params:
 * - petId (UUID): Pet identifier
 *
 * Returns:
 * - 204: Pet deleted successfully (no body)
 * - 400: Invalid UUID format
 * - 401: No session (future; MVP skips this)
 * - 403: Pet exists but belongs to another user
 * - 404: Pet not found or already deleted
 * - 500: Server error
 *
 * TODO: Add authentication once auth is implemented
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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
    const validationResult = PetIdSchema.safeParse(params);

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

    const { petId } = validationResult.data;

    // Step 3: Check if pet belongs to user via pet_owners table
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
            message: "Nie masz uprawnień do usunięcia tego zwierzęcia",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Pet doesn't exist or is already deleted (unified 404 for security)
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

    // Step 4: Verify pet is not already deleted
    const { data: currentPet, error: petCheckError } = await supabase
      .from("pets")
      .select("id, is_deleted")
      .eq("id", petId)
      .eq("is_deleted", false)
      .single();

    if (petCheckError || !currentPet) {
      // Pet doesn't exist or is already deleted
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

    // Step 5: Execute soft delete UPDATE
    // Set is_deleted = true and deleted_at = NOW()
    // Database trigger will automatically cascade soft delete to care_entries
    const { error: deleteError } = await supabase
      .from("pets")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", petId);

    if (deleteError) {
      console.error("Database error in DELETE /api/pets/:petId (delete):", {
        error: deleteError,
        userId,
        petId,
      });

      return new Response(
        JSON.stringify({
          error: "Database Error",
          message: "Nie udało się usunąć zwierzęcia",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 6: Return 204 No Content (no body)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Log unexpected errors for debugging
    console.error("Unexpected error in DELETE /api/pets/:petId:", error);

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
