import { Locator, Page } from "@playwright/test";

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  protected locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  async navigate(path = "/"): Promise<void> {
    await this.page.goto(path);
  }
}
