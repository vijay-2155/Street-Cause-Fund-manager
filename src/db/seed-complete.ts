import * as dotenv from "dotenv";

// Load environment variables before importing db
dotenv.config({ path: ".env.local" });

import { db, clubs, members, events, donations, expenses } from "./index";
import { eq } from "drizzle-orm";

/**
 * Complete seed script with users and test data
 * Run with: npm run db:seed:complete
 */

async function seed() {
  try {
    console.log("🌱 Seeding complete test data...\n");

    // ========================================
    // 1. CREATE CLUB
    // ========================================
    console.log("📍 Creating club...");

    const [club] = await db
      .insert(clubs)
      .values({
        name: "Street Cause",
        description: "Social service club dedicated to community welfare and charitable activities",
        upiId: "streetcause@upi",
      })
      .onConflictDoNothing()
      .returning();

    let clubId = club?.id;

    if (!clubId) {
      const existingClub = await db.select().from(clubs).limit(1);
      clubId = existingClub[0]?.id;
    }

    if (!clubId) {
      throw new Error("Failed to create or find club");
    }

    console.log(`✅ Club: ${clubId}\n`);

    // ========================================
    // 2. CREATE USERS
    // ========================================
    console.log("👥 Creating users...");

    const users = [
      {
        email: "vijaykumartholeti2005@gmail.com",
        fullName: "Vijay Kumar Tholeti",
        phone: "+91 98765 43210",
        role: "admin" as const,
      },
      {
        email: "vijayjee10000@gmail.com",
        fullName: "Vijay Jee",
        phone: "+91 98765 43211",
        role: "treasurer" as const,
      },
      {
        email: "thoughtvijay@gmail.com",
        fullName: "Vijay Thought",
        phone: "+91 98765 43212",
        role: "coordinator" as const,
      },
    ];

    const memberIds: Record<string, string> = {};

    for (const user of users) {
      const existing = await db
        .select()
        .from(members)
        .where(eq(members.email, user.email))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(members)
          .set({
            role: user.role,
            isActive: true,
            fullName: user.fullName,
            phone: user.phone,
            updatedAt: new Date(),
          })
          .where(eq(members.email, user.email));

        memberIds[user.role] = existing[0].id;
        console.log(`✅ Updated ${user.role}: ${user.email}`);
      } else {
        const [newMember] = await db
          .insert(members)
          .values({
            clubId: clubId,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: true,
          })
          .returning();

        memberIds[user.role] = newMember.id;
        console.log(`✅ Created ${user.role}: ${user.email}`);
      }
    }

    console.log("");

    // ========================================
    // 3. CREATE EVENTS
    // ========================================
    console.log("📅 Creating events...");

    const eventData = [
      {
        name: "Blood Donation Camp 2024",
        description: "Annual blood donation drive to help save lives in our community. Target: 100 donors.",
        targetAmount: "50000",
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "active" as const,
        createdBy: memberIds.admin,
      },
      {
        name: "Weekly Food Distribution",
        description: "Distribute meals to underprivileged families every Sunday. Feeding 200 families.",
        targetAmount: "75000",
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "active" as const,
        createdBy: memberIds.treasurer,
      },
      {
        name: "School Supplies Drive",
        description: "Provide notebooks, pens, and bags to 500 underprivileged students.",
        targetAmount: "100000",
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "upcoming" as const,
        createdBy: memberIds.coordinator,
      },
      {
        name: "Free Medical Checkup Camp",
        description: "Free health checkup and medicines for senior citizens. Served 150+ people.",
        targetAmount: "30000",
        startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "completed" as const,
        createdBy: memberIds.admin,
      },
    ];

    const createdEvents = await db
      .insert(events)
      .values(
        eventData.map((e) => ({
          clubId,
          ...e,
        }))
      )
      .returning();

    console.log(`✅ Created ${createdEvents.length} events\n`);

    // ========================================
    // 4. CREATE DONATIONS
    // ========================================
    console.log("💰 Creating donations...");

    const donationData = [
      // Blood Donation Camp
      { eventId: createdEvents[0].id, donorName: "Rajesh Kumar", donorEmail: "rajesh.k@gmail.com", donorPhone: "+91 98765 11111", amount: "5000", paymentMode: "upi" as const, transactionId: "UPI2024012345", collectedBy: memberIds.coordinator, daysAgo: 8 },
      { eventId: createdEvents[0].id, donorName: "Priya Sharma", donorEmail: "priya.sharma@gmail.com", donorPhone: "+91 98765 22222", amount: "3000", paymentMode: "upi" as const, transactionId: "UPI2024012346", collectedBy: memberIds.coordinator, daysAgo: 7 },
      { eventId: createdEvents[0].id, donorName: "Amit Patel", donorEmail: "amit.patel@gmail.com", donorPhone: "+91 98765 33333", amount: "10000", paymentMode: "bank_transfer" as const, transactionId: "TXN2024012347", collectedBy: memberIds.admin, daysAgo: 6 },
      { eventId: createdEvents[0].id, donorName: "Sneha Reddy", donorPhone: "+91 98765 44444", amount: "2000", paymentMode: "cash" as const, collectedBy: memberIds.coordinator, daysAgo: 5 },
      { eventId: createdEvents[0].id, donorName: "Karthik Rao", donorEmail: "karthik.rao@gmail.com", amount: "7500", paymentMode: "upi" as const, transactionId: "UPI2024012348", collectedBy: memberIds.treasurer, daysAgo: 4 },
      // Food Distribution
      { eventId: createdEvents[1].id, donorName: "Meera Nair", donorEmail: "meera.nair@gmail.com", donorPhone: "+91 98765 55555", amount: "15000", paymentMode: "upi" as const, transactionId: "UPI2024012349", collectedBy: memberIds.coordinator, daysAgo: 4 },
      { eventId: createdEvents[1].id, donorName: "Suresh Iyer", donorEmail: "suresh.iyer@gmail.com", donorPhone: "+91 98765 66666", amount: "8000", paymentMode: "bank_transfer" as const, transactionId: "TXN2024012350", collectedBy: memberIds.treasurer, daysAgo: 3 },
      { eventId: createdEvents[1].id, donorName: "Divya Menon", donorPhone: "+91 98765 77777", amount: "5000", paymentMode: "cash" as const, collectedBy: memberIds.coordinator, daysAgo: 2 },
      { eventId: createdEvents[1].id, donorName: "Rahul Verma", donorEmail: "rahul.v@gmail.com", donorPhone: "+91 98765 88888", amount: "12000", paymentMode: "upi" as const, transactionId: "UPI2024012351", collectedBy: memberIds.admin, daysAgo: 1 },
      // General donations
      { donorName: "Anonymous Donor", amount: "25000", paymentMode: "bank_transfer" as const, transactionId: "TXN2024012352", collectedBy: memberIds.admin, notes: "General fund contribution", daysAgo: 10 },
      { donorName: "Tech Corp Ltd", donorEmail: "csr@techcorp.com", donorPhone: "+91 98765 99999", amount: "50000", paymentMode: "bank_transfer" as const, transactionId: "TXN2024012353", collectedBy: memberIds.treasurer, notes: "CSR contribution", daysAgo: 15 },
    ];

    const createdDonations = await db
      .insert(donations)
      .values(
        donationData.map((d) => ({
          clubId,
          eventId: d.eventId || null,
          donorName: d.donorName,
          donorEmail: d.donorEmail || null,
          donorPhone: d.donorPhone || null,
          amount: d.amount,
          paymentMode: d.paymentMode,
          transactionId: d.transactionId || null,
          collectedBy: d.collectedBy,
          notes: d.notes || null,
          donationDate: new Date(Date.now() - d.daysAgo * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        }))
      )
      .returning();

    console.log(`✅ Created ${createdDonations.length} donations\n`);

    // ========================================
    // 5. CREATE EXPENSES
    // ========================================
    console.log("📊 Creating expenses...");

    const expenseData = [
      // Approved
      { eventId: createdEvents[0].id, title: "Medical Supplies", description: "Blood bags, cotton, bandages, antiseptic", amount: "8500", category: "medical" as const, status: "approved" as const, submittedBy: memberIds.coordinator, approvedBy: memberIds.treasurer, daysAgo: 9 },
      { eventId: createdEvents[0].id, title: "Refreshments", description: "Juice, biscuits, fruits for donors", amount: "3500", category: "food" as const, status: "approved" as const, submittedBy: memberIds.coordinator, approvedBy: memberIds.admin, daysAgo: 8 },
      { eventId: createdEvents[0].id, title: "Venue Rental", description: "Community hall rental for 1 day", amount: "5000", category: "venue" as const, status: "approved" as const, submittedBy: memberIds.admin, approvedBy: memberIds.treasurer, daysAgo: 10 },
      { eventId: createdEvents[1].id, title: "Groceries Purchase", description: "Rice, dal, vegetables for 200 families", amount: "18000", category: "food" as const, status: "approved" as const, submittedBy: memberIds.coordinator, approvedBy: memberIds.treasurer, daysAgo: 5 },
      { eventId: createdEvents[1].id, title: "Transportation", description: "Vehicle rental for food delivery", amount: "2500", category: "transport" as const, status: "approved" as const, submittedBy: memberIds.coordinator, approvedBy: memberIds.admin, daysAgo: 4 },
      { eventId: createdEvents[1].id, title: "Packaging Materials", description: "Bags, containers for food packets", amount: "1500", category: "supplies" as const, status: "approved" as const, submittedBy: memberIds.treasurer, approvedBy: memberIds.admin, daysAgo: 5 },
      // Pending
      { eventId: createdEvents[0].id, title: "Promotional Banners", description: "Printed banners for blood donation awareness", amount: "4000", category: "printing" as const, status: "pending" as const, submittedBy: memberIds.coordinator, daysAgo: 2 },
      { eventId: createdEvents[1].id, title: "Additional Groceries", description: "Extra supplies for 50 more families", amount: "4500", category: "food" as const, status: "pending" as const, submittedBy: memberIds.coordinator, daysAgo: 1 },
      { title: "Office Supplies", description: "Registers, pens, printing for documentation", amount: "2000", category: "supplies" as const, status: "pending" as const, submittedBy: memberIds.treasurer, daysAgo: 0 },
      // Rejected
      { eventId: createdEvents[0].id, title: "Entertainment Equipment", description: "Sound system rental", amount: "12000", category: "other" as const, status: "rejected" as const, submittedBy: memberIds.coordinator, approvedBy: memberIds.admin, rejectionReason: "Not aligned with event goals. Please resubmit with justification.", daysAgo: 6 },
    ];

    const createdExpenses = await db
      .insert(expenses)
      .values(
        expenseData.map((e) => ({
          clubId,
          eventId: e.eventId || null,
          title: e.title,
          description: e.description,
          amount: e.amount,
          category: e.category,
          status: e.status,
          submittedBy: e.submittedBy,
          approvedBy: e.approvedBy || null,
          approvedAt: e.approvedBy ? new Date(Date.now() - (e.daysAgo - 1) * 24 * 60 * 60 * 1000) : null,
          rejectionReason: e.rejectionReason || null,
          expenseDate: new Date(Date.now() - e.daysAgo * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        }))
      )
      .returning();

    console.log(`✅ Created ${createdExpenses.length} expenses\n`);

    // ========================================
    // 6. SUMMARY
    // ========================================
    console.log("========================================");
    console.log("✨ Complete Test Data Created!");
    console.log("========================================");

    const allMembers = await db.select().from(members).where(eq(members.clubId, clubId));
    const allEvents = await db.select().from(events).where(eq(events.clubId, clubId));
    const allDonations = await db.select().from(donations).where(eq(donations.clubId, clubId));
    const allExpenses = await db.select().from(expenses).where(eq(expenses.clubId, clubId));

    const totalDonations = allDonations.reduce((sum, d) => sum + Number(d.amount), 0);
    const approvedExpenses = allExpenses.filter((e) => e.status === "approved");
    const totalExpenses = approvedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const pendingExpenses = allExpenses.filter((e) => e.status === "pending");
    const totalPending = pendingExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    console.log(`Club: Street Cause`);
    console.log(`Users: ${allMembers.length} (${allMembers.filter((m) => m.role === "admin").length} admin, ${allMembers.filter((m) => m.role === "treasurer").length} treasurer, ${allMembers.filter((m) => m.role === "coordinator").length} coordinator)`);
    console.log(`Events: ${allEvents.length}`);
    console.log(`Donations: ${allDonations.length} (Total: ₹${totalDonations.toLocaleString("en-IN")})`);
    console.log(`Expenses: ${allExpenses.length} (${approvedExpenses.length} approved: ₹${totalExpenses.toLocaleString("en-IN")}, ${pendingExpenses.length} pending: ₹${totalPending.toLocaleString("en-IN")})`);
    console.log(`Balance: ₹${(totalDonations - totalExpenses).toLocaleString("en-IN")}`);
    console.log("========================================\n");

    console.log("📝 Next Steps:");
    console.log("1. Run UPDATE_AUTH_TRIGGER.sql in Supabase SQL Editor (one-time setup)");
    console.log("2. Each user should sign in with Google");
    console.log("3. Test the application with realistic data!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
