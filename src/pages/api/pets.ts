import type { APIRoute } from "astro";
import { z } from "zod";
import type { CreatePetCommand, CreatePetResponseDto } from "../../types";
import { DEFAULT_USER_ID } from "../../db/supabase.client";

// Disable prerendering for API routes
export const prerender = false;

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
    // Step 1: Get supabase client from context.locals
    const { supabase } = locals;

    // TODO: Replace with authenticated user ID once auth is implemented
    const userId = DEFAULT_USER_ID;

    console.log(userId);

    // Step 2: Parse and validate request body using Zod schema
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
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
          headers: { "Content-Type": "application/json" },
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
            headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
