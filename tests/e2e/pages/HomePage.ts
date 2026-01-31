import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class HomePage extends BasePage {
  readonly hero: Locator;
  readonly callToAction: Locator;

  constructor(page: Page) {
    super(page);
    this.hero = this.locator('[data-testid="home-hero"]');
    this.callToAction = this.locator('[data-testid="home-cta"]');
  }

  async load(): Promise<void> {
    await this.navigate("/");
    await expect(this.hero).toBeVisible();
  }

  async captureHeroSnapshot(): Promise<void> {
    await expect(this.hero).toHaveScreenshot({ maxDiffPixelRatio: 0.05 });
  }

  async clickCTA(): Promise<void> {
    await this.callToAction.click();
  }
}
