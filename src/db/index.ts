import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as dotenv from "dotenv";

// Load environment variables if not already loaded (for seed scripts)
if (!process.env.DATABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config({ path: ".env.local" });
}

// Validate environment variable
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set in .env.local");
}

const connectionString = process.env.DATABASE_URL;

// Create postgres client with proper configuration
// For seed scripts and migrations, we need max: 1 to prevent connection pooling issues
const client = postgres(connectionString, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Required for Supabase Transaction pooler (pgBouncer)
});

export const db = drizzle(client, { schema });

// Export schema for easy access
export * from "./schema";
