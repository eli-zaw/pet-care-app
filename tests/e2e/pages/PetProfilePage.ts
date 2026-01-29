import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PetProfilePage extends BasePage {
  // Header section
  readonly header: Locator;
  readonly headerInfo: Locator;
  readonly headerEmoji: Locator;
  readonly headerName: Locator;
  readonly headerActions: Locator;

  // Action buttons
  readonly addEntryButton: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page) {
    super(page);

    // Header section
    this.header = this.locator('[data-testid="pet-header"]');
    this.headerInfo = this.locator('[data-testid="pet-header-info"]');
    this.headerEmoji = this.locator('[data-testid="pet-header-emoji"]');
    this.headerName = this.locator('[data-testid="pet-header-name"]');
    this.headerActions = this.locator('[data-testid="pet-header-actions"]');

    // Action buttons
    this.addEntryButton = this.locator('[data-testid="pet-header-add-entry-button"]');
    this.editButton = this.locator('[data-testid="pet-header-edit-button"]');
    this.deleteButton = this.locator('[data-testid="pet-header-delete-button"]');
  }

  async waitForProfile(): Promise<void> {
    await expect(this.header).toBeVisible();
  }

  async clickAddEntry(): Promise<void> {
    await this.addEntryButton.click();
  }

  async clickEdit(): Promise<void> {
    await this.editButton.click();
  }

  async clickDelete(): Promise<void> {
    await this.deleteButton.click();
  }

  async expectPetName(expectedName: string): Promise<void> {
    await expect(this.headerName).toHaveText(expectedName);
  }

  async expectPetEmoji(expectedEmoji: string): Promise<void> {
    await expect(this.headerEmoji).toHaveText(expectedEmoji);
  }

  async expectAddEntryButtonVisible(): Promise<void> {
    await expect(this.addEntryButton).toBeVisible();
  }

  async expectEditButtonVisible(): Promise<void> {
    await expect(this.editButton).toBeVisible();
  }

  async expectDeleteButtonVisible(): Promise<void> {
    await expect(this.deleteButton).toBeVisible();
  }
}