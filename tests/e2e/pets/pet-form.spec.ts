import { test, expect } from "@playwright/test";
import { PetFormPage, PetsListPage } from "../pages";

test.describe("Pet Form - PET Scenarios", () => {
  let petsList: PetsListPage;
  let petForm: PetFormPage;

  test.beforeEach(async ({ page }) => {
    petsList = new PetsListPage(page);
    petForm = new PetFormPage(page);

    await page.goto("/dashboard");
    await petsList.waitForList();
  });

  test("PET-01: Adding duplicate pet name shows conflict error", async ({ page }) => {
    await petsList.clickAddPet();
    await petForm.waitForForm();
    await petForm.expectFormTitle("Dodaj swojego pupila");

    await petForm.fillName("Test Duplicate");
    await petForm.selectSpecies("dog");
    await petForm.submitForm();
    await page.waitForURL(/\/pets\/.+/);

    await page.goto("/dashboard");
    await petsList.waitForList();

    await petsList.clickAddPet();
    await petForm.waitForForm();
    await petForm.fillName("Test Duplicate");
    await petForm.selectSpecies("cat");
    await petForm.submitForm();

    await petForm.expectNameError("Zwierzę o tej nazwie już istnieje");
    await expect(page).toHaveURL(/\/pets\/new/);
  });

  test("PET-02: Editing pet name updates profile header", async ({ page }) => {
    const petCards = page.locator('[data-testid^="pet-card-"]');
    const firstPetCard = petCards.first();

    const petId = await firstPetCard.getAttribute("data-testid").then((attr) => attr?.replace("pet-card-", ""));
    const currentName = await firstPetCard.locator('[data-testid="pet-card-name"]').textContent();

    if (!petId || !currentName) {
      test.skip();
      return;
    }

    await firstPetCard.click();
    await page.waitForURL(`/pets/${petId}`, { waitUntil: "networkidle" });

    const { PetProfilePage } = await import("../pages");
    const petProfile = new PetProfilePage(page);
    await petProfile.waitForProfile();

    await petProfile.clickEdit();
    await petForm.waitForForm();
    await petForm.expectFormTitle(`Edytuj ${currentName}`);

    const timestamp = Date.now();
    const newName = `Edited Pet ${timestamp}`;
    await petForm.fillName(newName);
    await petForm.submitForm();

    await page.waitForURL(`/pets/${petId}`);
    await petProfile.waitForProfile();
    await petProfile.expectPetName(newName);
  });

  test("PET-03: Species field is disabled in edit mode", async ({ page }) => {
    const petCards = page.locator('[data-testid^="pet-card-"]');
    const firstPetCard = petCards.first();

    const petId = await firstPetCard.getAttribute("data-testid").then((attr) => attr?.replace("pet-card-", ""));

    if (!petId) {
      test.skip();
      return;
    }

    await firstPetCard.click();
    await page.waitForURL(`/pets/${petId}`);

    const { PetProfilePage } = await import("../pages");
    const petProfile = new PetProfilePage(page);
    await petProfile.waitForProfile();

    await petProfile.clickEdit();
    await petForm.waitForForm();
    await petForm.expectSpeciesDisabled();
  });
});
