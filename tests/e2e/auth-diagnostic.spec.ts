import { test } from '@playwright/test';
import { AuthPage } from './pages';

test.describe('Authentication Diagnostic', () => {
  test('Test login process step by step', async ({ page }) => {
    const auth = new AuthPage(page);

    // Check if server is running
    try {
      const response = await page.request.get('http://localhost:4173');
    } catch (error) {
      test.skip('Server is not running');
    }

    // Navigate to login page
    await page.goto('http://localhost:4173/login');

    // Debug current state
    await auth.debugCurrentState();

    // Try to login
    try {
      await auth.login();

      if (await auth.isLoginSuccessful()) {
      } else {
        await auth.debugCurrentState();
      }
    } catch (error) {
      await auth.debugCurrentState();
      throw error;
    }
  });

  test('Check if test user exists via API', async ({ page }) => {
    // Test direct API call to check authentication
    try {
      const testEmail = process.env.E2E_USERNAME || 'test@example.com';
      const testPassword = process.env.E2E_PASSWORD || 'testpassword123';

      const loginResponse = await page.request.post('http://localhost:4173/api/auth/login', {
        data: {
          email: testEmail,
          password: testPassword
        }
      });

      if (loginResponse.status() === 200) {
        const responseData = await loginResponse.json();
      } else {
        await loginResponse.json().catch(() => ({}));
      }
    } catch (error) {
    }
  });

  test('Check dashboard access without login', async ({ page }) => {
    // Try to access dashboard directly
    const response = await page.request.get('http://localhost:4173/dashboard');

    if (response.status() === 200) {
    } else if (response.status() === 401) {
    } else if (response.status() === 302) {
    } else {
    }
  });
});