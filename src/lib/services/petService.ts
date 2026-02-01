import type { SupabaseClient } from "@/db/supabase.client";
import type { CreatePetCommand, CreatePetResponseDto } from "@/types";
import { CreatePetSchema } from "@/lib/schemas";

export type CreatePetResult =
  | {
      success: true;
      data: CreatePetResponseDto;
    }
  | {
      success: false;
      status: number;
      error: string;
      details?: { field: string; message: string }[];
    };

export async function createPet(supabase: SupabaseClient, userId: string, body: unknown): Promise<CreatePetResult> {
  try {
    // Parse and validate request body using Zod schema
    let parsedBody: unknown;
    try {
      parsedBody = body;
    } catch {
      return {
        success: false,
        status: 400,
        error: "Bad Request",
        message: "Nieprawidłowy format JSON",
      };
    }

    const validationResult = CreatePetSchema.safeParse(parsedBody);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return {
        success: false,
        status: 400,
        error: "Validation Failed",
        message: "Walidacja danych wejściowych nie powiodła się",
        details: errors,
      };
    }

    const validatedData: CreatePetCommand = validationResult.data;

    // Check if pet with same name already exists for this user
    // (active pets only, case-insensitive)
    const { data: existingPets, error: checkError } = await supabase
      .from("pets")
      .select("id, name")
      .eq("is_deleted", false)
      .ilike("name", validatedData.name.trim())
      .limit(1);

    if (checkError) {
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
        return {
          success: false,
          status: 409,
          error: "Conflict",
          message: `Zwierzę o imieniu "${validatedData.name}" już istnieje w Twoim profilu`,
        };
      }
    }

    // Insert pet into database with validated data
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

    // Map database errors to HTTP status codes
    if (insertError) {
      // Handle specific database errors
      if (insertError.code === "23505") {
        // unique_violation
        return {
          success: false,
          status: 409,
          error: "Conflict",
          message: "Zwierzę o tej nazwie już istnieje",
        };
      }

      return {
        success: false,
        status: 500,
        error: "Database Error",
        message: "Nie udało się utworzyć zwierzęcia",
      };
    }

    if (!newPet) {
      return {
        success: false,
        status: 500,
        error: "Database Error",
        message: "Nie udało się pobrać danych utworzonego zwierzęcia",
      };
    }

    // Create ownership link
    const { error: ownershipError } = await supabase.from("pet_owners").insert({
      user_id: userId,
      pet_id: newPet.id,
    });

    if (ownershipError) {
      // Don't fail the request if ownership creation fails
      // The pet is created, user just won't see it in their list
    }

    return {
      success: true,
      data: newPet,
    };
  } catch {
    return {
      success: false,
      status: 500,
      error: "Server Error",
      message: "Wystąpił nieoczekiwany błąd serwera",
    };
  }
}
