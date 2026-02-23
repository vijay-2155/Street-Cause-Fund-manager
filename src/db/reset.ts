import { db } from "./index";
import { sql } from "drizzle-orm";

async function reset() {
  console.log("⚠️  Dropping all application tables...");

  await db.execute(sql`
    DROP TABLE IF EXISTS donations CASCADE;
    DROP TABLE IF EXISTS expenses CASCADE;
    DROP TABLE IF EXISTS events CASCADE;
    DROP TABLE IF EXISTS member_invites CASCADE;
    DROP TABLE IF EXISTS members CASCADE;
    DROP TABLE IF EXISTS clubs CASCADE;
  `);

  console.log("⚠️  Dropping all custom enums...");

  await db.execute(sql`
    DROP TYPE IF EXISTS user_role CASCADE;
    DROP TYPE IF EXISTS payment_mode CASCADE;
    DROP TYPE IF EXISTS expense_status CASCADE;
    DROP TYPE IF EXISTS expense_category CASCADE;
    DROP TYPE IF EXISTS event_status CASCADE;
    DROP TYPE IF EXISTS blood_group CASCADE;
  `);

  console.log("✅ All tables and enums dropped successfully.");
  console.log("👉 Now run: npm run db:push  to rebuild the schema.");
  process.exit(0);
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
