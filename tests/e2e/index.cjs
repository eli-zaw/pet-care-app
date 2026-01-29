// Script to run Playwright tests with environment variables loaded
const { execSync } = require("child_process");
const { readFileSync, existsSync } = require("fs");
const { join } = require("path");

// Load environment variables from .env.testing
const envPath = join(process.cwd(), ".env.testing");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf8");
  const envVars = {};

  envContent.split("\n").forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("#")) {
      const [key, ...valueParts] = trimmedLine.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").replace(/^["']|["']$/g, ""); // Remove quotes
        envVars[key] = value;
      }
    }
  });

  // Merge with existing environment variables
  Object.assign(process.env, envVars);
  console.log("✅ Environment variables loaded from .env.testing");
} else {
  console.log("⚠️  .env.testing file not found");
}

// Get command line arguments (excluding 'node' and script name)
const args = process.argv.slice(2);

// Check if we should seed the database
if (process.env.E2E_SEED_DB === "true") {
  console.log("🌱 Seeding database...");
  try {
    execSync("npx supabase db seed", { stdio: "inherit" });
    console.log("✅ Database seeded successfully");
  } catch (error) {
    console.log("⚠️  Database seeding failed, continuing with tests...");
  }
}

console.log(`🚀 Running: npx playwright test ${args.join(" ")}`);

try {
  // Run playwright with the provided arguments
  execSync(`npx playwright test ${args.join(" ")}`, {
    stdio: "inherit",
    env: process.env,
  });
} catch (error) {
  console.log("❌ Test execution failed");
  process.exit(error.status || 1);
}
