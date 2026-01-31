import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class DeletePetDialogPage extends BasePage {
  // Dialog elements
  readonly dialog: Locator;
  readonly icon: Locator;
  readonly title: Locator;
  readonly description: Locator;

  // Action buttons
  readonly cancelButton: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    super(page);

    // Dialog elements
    this.dialog = this.locator('[data-testid="delete-pet-dialog"]');
    this.icon = this.locator('[data-testid="delete-pet-dialog-icon"]');
    this.title = this.locator('[data-testid="delete-pet-dialog-title"]');
    this.description = this.locator('[data-testid="delete-pet-dialog-description"]');

    // Action buttons
    this.cancelButton = this.locator('[data-testid="delete-pet-dialog-cancel-button"]');
    this.confirmButton = this.locator('[data-testid="delete-pet-dialog-confirm-button"]');
  }

  async waitForDialog(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async expectDialogVisible(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async expectDialogHidden(): Promise<void> {
    await expect(this.dialog).toBeHidden();
  }

  async expectTitle(expectedTitle: string): Promise<void> {
    await expect(this.title).toHaveText(expectedTitle);
  }

  async expectDescriptionContains(text: string): Promise<void> {
    await expect(this.description).toContainText(text);
  }

  async cancelDeletion(): Promise<void> {
    await this.cancelButton.click();
  }

  async confirmDeletion(): Promise<void> {
    await this.confirmButton.click();
  }

  async expectConfirmButtonText(expectedText: string): Promise<void> {
    await expect(this.confirmButton).toHaveText(expectedText);
  }
}
