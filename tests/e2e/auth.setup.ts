import { test as setup, type Page } from "@playwright/test";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { GoTrueAdminApi } from "@supabase/auth-js";
import { AuthPage } from "./pages/AuthPage";
import { storageStatePath } from "./auth/session";
import { getTestUser, type TestUserData } from "./auth/test-user";

const E2E_BASE_URL = process.env.E2E_BASE_URL || "http://localhost:4173";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_KEY;
const adminClient =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

setup("authenticate and save session", async ({ page }) => {
  const testUser = getTestUser();

  await ensureTestUserRegistered(testUser);

  if (!existsSync(dirname(storageStatePath))) {
    mkdirSync(dirname(storageStatePath), { recursive: true });
  }

  const authPage = new AuthPage(page);
  await authPage.login(testUser.email, testUser.password);

  await page.context().storageState({ path: storageStatePath });
});

async function ensureTestUserRegistered(user: TestUserData): Promise<void> {
  if (adminClient) {
    await ensureTestUserWithServiceRole(adminClient, user);
    return;
  }

  await registerUserViaApi(user);
}

function createSupabaseAdminClient(supabaseUrl: string, serviceRoleKey: string): GoTrueAdminApi {
  const trimmedUrl = supabaseUrl.replace(/\/+$/, "");
  return new GoTrueAdminApi({
    url: `${trimmedUrl}/auth/v1`,
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
  });
}

async function ensureTestUserWithServiceRole(client: GoTrueAdminApi, user: TestUserData): Promise<void> {
  const { error } = await client.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
  });

  if (error) {
    if (isAlreadyRegisteredError(error.message)) {
      await resetExistingUserPassword(client, user);
      return;
    }

    throw new Error(`Unable to create test user (${error.message})`);
  }
}

async function resetExistingUserPassword(client: GoTrueAdminApi, user: TestUserData): Promise<void> {
  const { data, error } = await client.generateLink({
    type: "magiclink",
    email: user.email,
  });

  if (error || !data?.user?.id) {
    throw new Error(`Unable to resolve existing user: ${error?.message ?? "missing user data"}`);
  }

  const { error: updateError } = await client.updateUserById(data.user.id, {
    password: user.password,
    email_confirm: true,
  });

  if (updateError) {
    throw new Error(`Unable to update existing user (${updateError.message})`);
  }
}

function isAlreadyRegisteredError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already exists") ||
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("has already been registered") ||
    normalized.includes("already in use")
  );
}

async function registerUserViaApi(user: TestUserData): Promise<void> {
  const response = await fetch(`${E2E_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
    }),
  });

  if (response.ok || response.status === 409) {
    return;
  }

  const bodyText = await response.text();
  const parsedBody = parseJsonOrText(bodyText);
  throw new Error(
    `Failed to register test user: ${response.status} ${response.statusText} ${JSON.stringify(parsedBody)}`
  );
}

function parseJsonOrText(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
