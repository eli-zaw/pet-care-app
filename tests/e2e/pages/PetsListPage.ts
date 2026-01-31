import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class PetsListPage extends BasePage {
  // List container
  readonly list: Locator;
  readonly grid: Locator;
  readonly loading: Locator;
  readonly loadingMore: Locator;
  readonly empty: Locator;
  readonly pagination: Locator;

  // Header
  readonly header: Locator;
  readonly headerTitle: Locator;
  readonly headerCount: Locator;
  readonly addPetButton: Locator;

  constructor(page: Page) {
    super(page);

    // List container
    this.list = this.locator('[data-testid="pets-list"]');
    this.grid = this.locator('[data-testid="pets-list-grid"]');
    this.loading = this.locator('[data-testid="pets-list-loading"]');
    this.loadingMore = this.locator('[data-testid="pets-list-loading-more"]');
    this.empty = this.locator('[data-testid="pets-list-empty"]');
    this.pagination = this.locator('[data-testid="pets-list-pagination"]');

    // Header
    this.header = this.locator('[data-testid="pets-header"]');
    this.headerTitle = this.locator('[data-testid="pets-header-title"]');
    this.headerCount = this.locator('[data-testid="pets-header-count"]');
    this.addPetButton = this.locator('[data-testid="pets-header-add-pet-button"]');
  }

  async waitForList(): Promise<void> {
    await expect(this.list.or(this.loading).or(this.empty)).toBeVisible();
  }

  async waitForGrid(): Promise<void> {
    await expect(this.grid).toBeVisible();
  }

  async clickAddPet(): Promise<void> {
    if (await this.addPetButton.isVisible()) {
      await expect(this.addPetButton).toBeVisible();
      await this.addPetButton.click();
      return;
    }

    const emptyStateCta = this.page.locator('[data-testid="pets-list-empty-cta-button"]');
    await expect(emptyStateCta).toBeVisible();
    await emptyStateCta.click();
  }

  getPetCard(petId: string): Locator {
    return this.page.locator(`[data-testid="pet-card-${petId}"]`);
  }

  async clickPetCard(petId: string): Promise<void> {
    const card = this.getPetCard(petId);
    await expect(card).toBeVisible();

    // Click on the pet name within the card
    const petName = card.locator('[data-testid="pet-card-name"]');
    await expect(petName).toBeVisible();
    await petName.click();
  }

  async expectPetCardVisible(petId: string): Promise<void> {
    const card = this.getPetCard(petId);
    await expect(card).toBeVisible();
  }

  async expectPetCardHidden(petId: string): Promise<void> {
    const card = this.getPetCard(petId);
    await expect(card).toBeHidden();
  }

  async expectPetNameInCard(petId: string, expectedName: string): Promise<void> {
    const card = this.getPetCard(petId);
    const nameElement = card.locator('[data-testid="pet-card-name"]');
    await expect(nameElement).toHaveText(expectedName);
  }

  async expectPetEmojiInCard(petId: string, expectedEmoji: string): Promise<void> {
    const card = this.getPetCard(petId);
    const emojiElement = card.locator('[data-testid="pet-card-emoji"]');
    await expect(emojiElement).toHaveText(expectedEmoji);
  }

  async expectEmptyStateVisible(): Promise<void> {
    await expect(this.empty).toBeVisible();
  }

  async expectEmptyStateHidden(): Promise<void> {
    await expect(this.empty).toBeHidden();
  }

  async expectLoadingVisible(): Promise<void> {
    await expect(this.loading).toBeVisible();
  }

  async expectLoadingHidden(): Promise<void> {
    await expect(this.loading).toBeHidden();
  }

  async expectHeaderTitle(expectedTitle: string): Promise<void> {
    await expect(this.headerTitle).toHaveText(expectedTitle);
  }

  async expectHeaderCount(expectedCount: string): Promise<void> {
    await expect(this.headerCount).toHaveText(expectedCount);
  }

  async expectAddPetButtonVisible(): Promise<void> {
    await expect(this.addPetButton).toBeVisible();
  }

  async expectAddPetButtonHidden(): Promise<void> {
    await expect(this.addPetButton).toBeHidden();
  }

  async getPetCardCount(): Promise<number> {
    return await this.page.locator('[data-testid^="pet-card-"]').count();
  }

  async expectPetCardCount(expectedCount: number): Promise<void> {
    const actualCount = await this.getPetCardCount();
    expect(actualCount).toBe(expectedCount);
  }
}
