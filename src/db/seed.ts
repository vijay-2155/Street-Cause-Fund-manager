import * as dotenv from "dotenv";

// Load environment variables before importing db
dotenv.config({ path: ".env.local" });

import { db, clubs, members } from "./index";
import { eq, sql } from "drizzle-orm";

/**
 * Seed script to create initial users and setup auth trigger
 * Run with: npx tsx src/db/seed.ts
 */

async function seed() {
  try {
    console.log("🌱 Seeding database...");

    // 1. Create/Update Auth Trigger (optional - may require manual setup in Supabase)
    console.log("🔧 Setting up auth trigger...");

    try {
      await db.execute(sql`
        CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER AS $$
      DECLARE
          user_email TEXT;
          existing_member_id UUID;
          default_club_id UUID;
      BEGIN
          user_email := NEW.email;

          -- Check if a member already exists with this email (pre-created)
          SELECT id, club_id INTO existing_member_id, default_club_id
          FROM members
          WHERE email = user_email
          LIMIT 1;

          IF existing_member_id IS NOT NULL THEN
              -- Member already exists, just link the auth_id
              UPDATE members
              SET auth_id = NEW.id,
                  updated_at = NOW()
              WHERE id = existing_member_id;

              RAISE NOTICE 'Linked existing member % to auth user %', existing_member_id, NEW.id;
              RETURN NEW;
          END IF;

          -- No pre-created member found, check for invite
          -- Get the default club (first club in the system)
          SELECT id INTO default_club_id FROM clubs LIMIT 1;

          -- Check if there's a pending invite for this email
          IF EXISTS (
              SELECT 1 FROM member_invites
              WHERE email = user_email
              AND accepted_at IS NULL
              AND (expires_at IS NULL OR expires_at > NOW())
          ) THEN
              -- Create member from invite
              INSERT INTO members (auth_id, club_id, full_name, email, role)
              SELECT
                  NEW.id,
                  default_club_id,
                  COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(user_email, '@', 1)),
                  user_email,
                  COALESCE(mi.role, 'coordinator')
              FROM member_invites mi
              WHERE mi.email = user_email
              AND mi.accepted_at IS NULL
              LIMIT 1;

              -- Mark invite as accepted
              UPDATE member_invites
              SET accepted_at = NOW()
              WHERE email = user_email;

              RAISE NOTICE 'Created member from invite for %', user_email;
          ELSE
              -- No invite and no pre-created member - create inactive member
              INSERT INTO members (auth_id, club_id, full_name, email, role, is_active)
              VALUES (
                  NEW.id,
                  default_club_id,
                  COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(user_email, '@', 1)),
                  user_email,
                  'coordinator',
                  false
              );

              RAISE NOTICE 'Created inactive member for uninvited user %', user_email;
          END IF;

          RETURN NEW;
      EXCEPTION
          WHEN OTHERS THEN
              RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
              RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

      await db.execute(sql`
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      `);

      await db.execute(sql`
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION handle_new_user();
      `);

      console.log("✅ Auth trigger created/updated");
    } catch (error: any) {
      console.log("⚠️  Could not create auth trigger automatically");
      console.log("📝 Please run UPDATE_AUTH_TRIGGER.sql in Supabase SQL Editor manually");
      console.log("   (This requires database admin permissions)\n");
    }

    // 2. Create or get the default club
    console.log("📍 Creating club...");

    const [club] = await db
      .insert(clubs)
      .values({
        name: "Street Cause",
        description:
          "Social service club dedicated to community welfare and charitable activities",
      })
      .onConflictDoNothing()
      .returning();

    let clubId = club?.id;

    // If club already exists, get its ID
    if (!clubId) {
      const existingClub = await db.select().from(clubs).limit(1);
      clubId = existingClub[0]?.id;
    }

    if (!clubId) {
      throw new Error("Failed to create or find club");
    }

    console.log(`✅ Club created/found: ${clubId}`);

    // 3. Create initial users
    console.log("👥 Creating users...");

    const users = [
      {
        email: "vijaykumartholeti2005@gmail.com",
        fullName: "Admin User",
        role: "admin" as const,
      },
      {
        email: "vijayjee10000@gmail.com",
        fullName: "Treasurer User",
        role: "treasurer" as const,
      },
      {
        email: "thoughtvijay@gmail.com",
        fullName: "Coordinator User",
        role: "coordinator" as const,
      },
    ];

    for (const user of users) {
      // Check if user already exists
      const existing = await db
        .select()
        .from(members)
        .where(eq(members.email, user.email))
        .limit(1);

      if (existing.length > 0) {
        // Update existing user
        await db
          .update(members)
          .set({
            role: user.role,
            isActive: true,
            fullName: user.fullName,
            updatedAt: new Date(),
          })
          .where(eq(members.email, user.email));

        console.log(`✅ Updated ${user.role}: ${user.email}`);
      } else {
        // Create new user
        await db.insert(members).values({
          clubId: clubId,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isActive: true,
        });

        console.log(`✅ Created ${user.role}: ${user.email}`);
      }
    }

    // 4. Verify users were created
    console.log("\n📋 Verifying users...");
    const allUsers = await db
      .select({
        fullName: members.fullName,
        email: members.email,
        role: members.role,
        isActive: members.isActive,
      })
      .from(members)
      .where(eq(members.clubId, clubId));

    console.table(allUsers);

    console.log("\n✨ Seeding completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("1. Each user should sign in with Google using their email");
    console.log("2. The system will automatically link their accounts");
    console.log("3. They'll have immediate access with their assigned roles");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
