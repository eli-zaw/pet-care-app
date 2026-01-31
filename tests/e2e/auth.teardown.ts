import { test as teardown } from "@playwright/test";
import { getTestUser } from "./auth/test-user";

teardown("cleanup test data", async ({ request }) => {
  try {
    const petsResponse = await request.get("/api/pets");

    if (petsResponse.ok()) {
      const petsData = await petsResponse.json();
      const pets = petsData.pets || [];

      for (const pet of pets) {
        await request.delete(`/api/pets/${pet.id}`);
      }
    }
  } catch (error) {
    // Cleanup is non-critical, continue
  }
});
