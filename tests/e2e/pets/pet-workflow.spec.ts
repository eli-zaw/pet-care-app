import { test, expect } from "@playwright/test";
import { PetWorkflows } from "../pages";

test.describe("Pet Management Workflow - End-to-End", () => {
  let workflows: PetWorkflows;

  test.beforeEach(async ({ page }) => {
    workflows = new PetWorkflows(page);
  });

  test("Complete pet lifecycle: Create → Edit → Delete", async ({ page }) => {
    await workflows.prepareDashboard();

    const timestamp = Date.now();
    const petId = await workflows.createPet(`WorkflowTest ${timestamp}`, "dog");
    expect(petId).toBeTruthy();

    await workflows.editPetName(petId, `Edited ${timestamp}`);
    await workflows.prepareDashboard();

    await workflows.deletePet(petId);
    await workflows.prepareDashboard();
  });

  test("Duplicate pet creation validation", async ({ page }) => {
    await workflows.prepareDashboard();

    const testName = `DupTest${Date.now()}`;
    const petId = await workflows.createPet(testName, "dog");
    expect(petId).toBeTruthy();

    await workflows.prepareDashboard();
    await workflows.attemptDuplicatePetCreation(testName, "cat");
  });
});
