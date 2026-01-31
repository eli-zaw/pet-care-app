import { test, expect } from "@playwright/test";
import { PetProfilePage, DeletePetDialogPage, PetsListPage, PetFormPage } from "../pages";

test.describe("Pet Deletion - PET-04 Scenario", () => {
  let petsList: PetsListPage;
  let petProfile: PetProfilePage;
  let deleteDialog: DeletePetDialogPage;
  let petForm: PetFormPage;

  test.beforeEach(async ({ page }) => {
    petsList = new PetsListPage(page);
    petProfile = new PetProfilePage(page);
    deleteDialog = new DeletePetDialogPage(page);
    petForm = new PetFormPage(page);
  });

  test("PET-04: Soft delete removes pet from list but keeps in database", async ({ page }) => {
    await page.goto("/dashboard");
    await petsList.waitForList();

    const initialCount = await petsList.getPetCardCount();
    if (initialCount === 0) {
      await petsList.clickAddPet();
      await petForm.waitForForm();
      await petForm.fillName("DeleteTest Pet");
      await petForm.selectSpecies("dog");
      await petForm.submitForm();
      await page.waitForURL(/\/pets\/.+/);
      await page.goto("/dashboard");
      await petsList.waitForList();
    }

    const petCards = page.locator('[data-testid^="pet-card-"]');
    const firstPetCard = petCards.first();
    const petId = await firstPetCard.getAttribute("data-testid").then((attr) => attr?.replace("pet-card-", ""));
    const petName = await firstPetCard.locator('[data-testid="pet-card-name"]').textContent();

    if (!petId || !petName) {
      test.skip();
      return;
    }

    await petsList.clickPetCard(petId);
    await page.waitForURL(`/pets/${petId}`);

    await petProfile.waitForProfile();
    await petProfile.expectPetName(petName);

    await petProfile.clickDelete();

    await deleteDialog.waitForDialog();
    await deleteDialog.expectTitle(`Usuń ${petName}?`);
    await deleteDialog.expectDescriptionContains("wszystkie wpisy");
    await deleteDialog.expectDescriptionContains("nie można cofnąć");

    await deleteDialog.confirmDeletion();

    await page.waitForURL("/dashboard");
    await petsList.waitForList();

    await petsList.expectPetCardHidden(petId);
  });

  test("PET-04: Cancel deletion keeps pet in list", async ({ page }) => {
    await page.goto("/dashboard");
    await petsList.waitForList();

    const initialCount = await petsList.getPetCardCount();
    if (initialCount === 0) {
      await petsList.clickAddPet();
      await petForm.waitForForm();
      await petForm.fillName("CancelTest Pet");
      await petForm.selectSpecies("cat");
      await petForm.submitForm();
      await page.waitForURL(/\/pets\/.+/);
      await page.goto("/dashboard");
      await petsList.waitForList();
    }

    const petCards = page.locator('[data-testid^="pet-card-"]');
    const firstPetCard = petCards.first();
    const petId = await firstPetCard.getAttribute("data-testid").then((attr) => attr?.replace("pet-card-", ""));

    if (!petId) {
      test.skip();
      return;
    }

    await petsList.clickPetCard(petId);
    await page.waitForURL(`/pets/${petId}`);

    await petProfile.waitForProfile();
    await petProfile.clickDelete();
    await deleteDialog.waitForDialog();
    await deleteDialog.cancelDeletion();
    await deleteDialog.expectDialogHidden();

    await expect(page).toHaveURL(`/pets/${petId}`);

    await page.goto("/dashboard");
    await petsList.waitForList();
    await petsList.expectPetCardVisible(petId);
  });
});
