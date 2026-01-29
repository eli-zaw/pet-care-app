/**
 * Static test user configuration for E2E tests
 */
export interface TestUserData {
  email: string;
  password: string;
  userId?: string;
}

/**
 * Get static test user credentials from environment
 */
export function getTestUser(): TestUserData {
  return {
    email: process.env.E2E_USERNAME || 'test@example.com',
    password: process.env.E2E_PASSWORD || 'testpassword123',
  };
}
