import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class AuthPage extends BasePage {
  // Login form elements
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly loginForm: Locator;

  // Error messages
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Login form
    this.emailInput = this.locator('input[type="email"]');
    this.passwordInput = this.locator('input[type="password"]');
    this.loginButton = this.locator('button[type="submit"]');
    this.loginForm = this.locator("form");

    // Error messages
    this.errorMessage = this.locator('[data-testid="error-message"], .text-destructive').first();
  }

  async login(email?: string, password?: string): Promise<void> {
    // Use environment variables if not provided
    const loginEmail = email || process.env.E2E_USERNAME || "test@example.com";
    const loginPassword = password || process.env.E2E_PASSWORD || "testpassword123";
    // Navigate to login page
    await this.navigate("/login");
    // Wait for form to load
    await expect(this.loginForm).toBeVisible();
    // Fill credentials (use clear + type to trigger React onChange)
    await this.emailInput.clear();
    await this.emailInput.type(loginEmail, { delay: 50 });

    await this.passwordInput.clear();
    await this.passwordInput.type(loginPassword, { delay: 50 });
    // Submit form
    await this.loginButton.click();
    // Wait for redirect to dashboard or success
    try {
      await this.page.waitForURL(/\/dashboard/, { timeout: 10000 });
    } catch (error) {
      // Check if we're still on login page (authentication failed)
      if (this.page.url().includes("/login")) {
        const errorVisible = await this.errorMessage.isVisible();
        if (errorVisible) {
          const errorText = await this.errorMessage.textContent();
        }
      }

      throw error;
    }
  }

  async expectLoginError(expectedError?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (expectedError) {
      await expect(this.errorMessage).toContainText(expectedError);
    }
  }

  async expectLoginSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async isLoginSuccessful(): Promise<boolean> {
    try {
      await this.page.waitForURL(/\/dashboard/, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async debugCurrentState(): Promise<void> {
    const loginFormVisible = await this.loginForm.isVisible().catch(() => false);
    const errorVisible = await this.errorMessage.isVisible().catch(() => false);

    if (errorVisible) {
      await this.errorMessage.textContent();
    }
  }
}
