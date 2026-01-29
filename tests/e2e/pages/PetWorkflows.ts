import { type Page } from '@playwright/test';
import { PetFormPage } from './PetFormPage';
import { PetProfilePage } from './PetProfilePage';
import { DeletePetDialogPage } from './DeletePetDialogPage';
import { PetsListPage } from './PetsListPage';

/**
 * Workflow helpers for complex pet management operations
 * Combines multiple Page Objects for end-to-end user journeys
 */
export class PetWorkflows {
  private page: Page;
  private petForm: PetFormPage;
  private petProfile: PetProfilePage;
  private deleteDialog: DeletePetDialogPage;
  private petsList: PetsListPage;

  constructor(page: Page) {
    this.page = page;
    this.petForm = new PetFormPage(page);
    this.petProfile = new PetProfilePage(page);
    this.deleteDialog = new DeletePetDialogPage(page);
    this.petsList = new PetsListPage(page);
  }

  /**
   * Complete workflow: Create pet -> Verify in list -> Edit name -> Delete
   */
  async createEditAndDeletePet(petName: string, species: 'dog' | 'cat' | 'other', newName: string): Promise<void> {
    // Navigate to dashboard
    await this.page.goto('/dashboard');
    await this.petsList.waitForList();

    // Create pet
    const petId = await this.createPet(petName, species);

    // Verify in list
    await this.petsList.expectPetCardVisible(petId);
    await this.petsList.expectPetNameInCard(petId, petName);

    // Edit pet name
    await this.editPetName(petId, newName);

    // Verify name changed
    await this.petsList.expectPetNameInCard(petId, newName);

    // Delete pet
    await this.deletePet(petId);

    // Verify removed from list
    await this.petsList.expectPetCardHidden(petId);
  }

  /**
   * Create a new pet and return its ID
   */
  async createPet(name: string, species: 'dog' | 'cat' | 'other'): Promise<string> {
    // Go to add pet form
    await this.petsList.clickAddPet();
    await this.petForm.waitForForm();

    // Fill form
    await this.petForm.fillName(name);
    await this.petForm.selectSpecies(species);
    await this.petForm.submitForm();

    // Wait for redirect to pet profile (UUID format, not "new")
    // UUID regex: 8-4-4-4-12 hex characters
    await this.page.waitForURL(/\/pets\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    const url = this.page.url();
    const petIdMatch = url.match(/\/pets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (!petIdMatch) {
      throw new Error('Could not extract pet ID from URL after creation');
    }

    return petIdMatch[1];
  }

  /**
   * Edit pet name
   */
  async editPetName(petId: string, newName: string): Promise<void> {
    // Go to pet profile and wait for page to be fully loaded
    await this.page.goto(`/pets/${petId}`, { waitUntil: 'networkidle' });
    await this.petProfile.waitForProfile();

    // Click edit
    await this.petProfile.clickEdit();
    await this.petForm.waitForForm();

    // Change name
    await this.petForm.fillName(newName);
    await this.petForm.submitForm();

    // Wait for redirect back to profile
    await this.page.waitForURL(`/pets/${petId}`);
    await this.petProfile.waitForProfile();
  }

  /**
   * Delete pet with confirmation
   */
  async deletePet(petId: string): Promise<void> {
    // Go to pet profile and wait for page to be fully loaded
    await this.page.goto(`/pets/${petId}`, { waitUntil: 'networkidle' });
    await this.petProfile.waitForProfile();

    // Click delete
    await this.petProfile.clickDelete();
    await this.deleteDialog.waitForDialog();

    // Confirm deletion
    await this.deleteDialog.confirmDeletion();

    // Wait for redirect to dashboard
    await this.page.waitForURL('/dashboard');
    await this.petsList.waitForList();
  }

  /**
   * Try to create pet with duplicate name and expect error
   */
  async attemptDuplicatePetCreation(name: string, species: 'dog' | 'cat' | 'other'): Promise<void> {
    // Go to add pet form
    await this.petsList.clickAddPet();
    await this.petForm.waitForForm();

    // Fill form with duplicate name
    await this.petForm.fillName(name);
    await this.petForm.selectSpecies(species);
    await this.petForm.submitForm();

    // Expect error on name field (409 conflict sets name error, not general)
    await this.petForm.expectNameError('Zwierzę o tej nazwie już istnieje');
  }

  /**
   * Navigate to dashboard and prepare for pet operations
   */
  async prepareDashboard(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.petsList.waitForList();
  }
}