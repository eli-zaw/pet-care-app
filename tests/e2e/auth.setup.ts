import { test as setup } from "@playwright/test";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { AuthPage } from "./pages/AuthPage";
import { storageStatePath } from "./auth/session";
import { getTestUser } from "./auth/test-user";

setup("authenticate and save session", async ({ page }) => {
  const testUser = getTestUser();

  if (!existsSync(dirname(storageStatePath))) {
    mkdirSync(dirname(storageStatePath), { recursive: true });
  }

  const authPage = new AuthPage(page);
  await authPage.login(testUser.email, testUser.password);

  await page.context().storageState({ path: storageStatePath });
});
