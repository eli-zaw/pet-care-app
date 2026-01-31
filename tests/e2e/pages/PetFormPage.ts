import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class PetFormPage extends BasePage {
  // Form container
  readonly form: Locator;
  readonly title: Locator;
  readonly description: Locator;

  // Error messages
  readonly generalError: Locator;

  // Name field
  readonly nameField: Locator;
  readonly nameInput: Locator;
  readonly nameError: Locator;

  // Species field
  readonly speciesField: Locator;
  readonly speciesSelect: Locator;
  readonly speciesTrigger: Locator;
  readonly speciesDisabledHint: Locator;
  readonly speciesError: Locator;

  // Action buttons
  readonly cancelButton: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);

    // Form container
    this.form = this.locator('[data-testid="pet-form"]');
    this.title = this.locator('[data-testid="pet-form-title"]');
    this.description = this.locator('[data-testid="pet-form-description"]');

    // Error messages
    this.generalError = this.locator('[data-testid="pet-form-general-error"]');

    // Name field
    this.nameField = this.locator('[data-testid="pet-form-name-field"]');
    this.nameInput = this.locator('[data-testid="pet-form-name-input"]');
    this.nameError = this.locator('[data-testid="pet-form-name-error"]');

    // Species field
    this.speciesField = this.locator('[data-testid="pet-form-species-field"]');
    this.speciesSelect = this.locator('[data-testid="pet-form-species-select"]');
    this.speciesTrigger = this.locator('[data-testid="pet-form-species-trigger"]');
    this.speciesDisabledHint = this.locator('[data-testid="pet-form-species-disabled-hint"]');
    this.speciesError = this.locator('[data-testid="pet-form-species-error"]');

    // Action buttons
    this.cancelButton = this.locator('[data-testid="pet-form-cancel-button"]');
    this.submitButton = this.locator('[data-testid="pet-form-submit-button"]');
  }

  async waitForForm(): Promise<void> {
    await expect(this.form).toBeVisible();
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.clear();
    await this.nameInput.type(name, { delay: 50 });
  }

  async selectSpecies(species: "dog" | "cat" | "other"): Promise<void> {
    await this.speciesTrigger.click();
    await this.page.locator(`[data-testid="pet-form-species-option-${species}"]`).click();
  }

  async submitForm(): Promise<void> {
    await this.submitButton.click();
  }

  async cancelForm(): Promise<void> {
    await this.cancelButton.click();
  }

  async expectNameError(errorText?: string): Promise<void> {
    if (errorText) {
      await expect(this.nameError).toHaveText(errorText);
    } else {
      await expect(this.nameError).toBeVisible();
    }
  }

  async expectSpeciesError(errorText?: string): Promise<void> {
    if (errorText) {
      await expect(this.speciesError).toHaveText(errorText);
    } else {
      await expect(this.speciesError).toBeVisible();
    }
  }

  async expectGeneralError(errorText?: string): Promise<void> {
    if (errorText) {
      await expect(this.generalError).toHaveText(errorText);
    } else {
      await expect(this.generalError).toBeVisible();
    }
  }

  async expectSpeciesDisabled(): Promise<void> {
    await expect(this.speciesTrigger).toBeDisabled();
    await expect(this.speciesDisabledHint).toBeVisible();
  }

  async expectFormTitle(expectedTitle: string): Promise<void> {
    await expect(this.title).toHaveText(expectedTitle);
  }
}
