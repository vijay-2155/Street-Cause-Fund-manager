import { db } from "./index";
import { clubs, members, events, donations, expenses } from "./schema";

async function seedWithMembers() {
  console.log("🌱 Seeding database with test data...");

  try {
    // 1. Create Club
    const [club] = await db
      .insert(clubs)
      .values({
        name: "Street Cause",
        description: "A community-driven organization dedicated to helping those in need",
        upiId: "streetcause@upi",
      })
      .returning();

    console.log("✅ Club created");

    // 2. Create Members (pre-seeded with NULL clerk_id)
    const [admin] = await db
      .insert(members)
      .values({
        clubId: club.id,
        fullName: "Vijay Kumar Tholeti",
        email: "vijaykumartholeti2005@gmail.com",
        phone: "9999999999",
        role: "admin",
        isActive: true,
      })
      .returning();

    const [treasurer] = await db
      .insert(members)
      .values({
        clubId: club.id,
        fullName: "Treasurer User",
        email: "treasurer@streetcause.org",
        phone: "9999999998",
        role: "treasurer",
        isActive: true,
      })
      .returning();

    const [coordinator] = await db
      .insert(members)
      .values({
        clubId: club.id,
        fullName: "Coordinator User",
        email: "coordinator@streetcause.org",
        phone: "9999999997",
        role: "coordinator",
        isActive: true,
      })
      .returning();

    console.log("✅ Members created (3)");

    // 3. Create Events
    const [event1] = await db
      .insert(events)
      .values({
        clubId: club.id,
        name: "Winter Food Drive 2026",
        description: "Collecting funds to provide warm meals to homeless individuals",
        targetAmount: "150000",
        startDate: "2026-01-15",
        endDate: "2026-03-31",
        status: "active",
        createdBy: admin.id,
      })
      .returning();

    const [event2] = await db
      .insert(events)
      .values({
        clubId: club.id,
        name: "Free Medical Camp - March 2026",
        description: "Organizing a free medical checkup camp for underprivileged communities",
        targetAmount: "200000",
        startDate: "2026-03-15",
        endDate: "2026-03-16",
        status: "upcoming",
        createdBy: treasurer.id,
      })
      .returning();

    const [event3] = await db
      .insert(events)
      .values({
        clubId: club.id,
        name: "School Supplies Distribution",
        description: "Distributed notebooks, pens, and bags to 200 students",
        targetAmount: "80000",
        startDate: "2026-01-05",
        endDate: "2026-01-20",
        status: "completed",
        createdBy: coordinator.id,
      })
      .returning();

    console.log("✅ Events created (3)");

    // 4. Create Donations
    await db.insert(donations).values([
      // Winter Food Drive donations
      {
        clubId: club.id,
        eventId: event1.id,
        donorName: "Rajesh Kumar",
        donorEmail: "rajesh.kumar@gmail.com",
        donorPhone: "9876543210",
        amount: "5000",
        paymentMode: "upi",
        transactionId: "UPI123456789",
        notes: "Happy to contribute",
        collectedBy: coordinator.id,
        donationDate: "2026-02-01",
      },
      {
        clubId: club.id,
        eventId: event1.id,
        donorName: "Priya Sharma",
        donorEmail: "priya.sharma@yahoo.com",
        donorPhone: "9876543211",
        amount: "10000",
        paymentMode: "bank_transfer",
        transactionId: "TXN987654321",
        collectedBy: coordinator.id,
        donationDate: "2026-02-03",
      },
      {
        clubId: club.id,
        eventId: event1.id,
        donorName: "Anonymous",
        amount: "2500",
        paymentMode: "cash",
        collectedBy: coordinator.id,
        donationDate: "2026-02-05",
      },
      // Medical Camp donations
      {
        clubId: club.id,
        eventId: event2.id,
        donorName: "Dr. Mehta",
        donorEmail: "dr.mehta@hospital.com",
        donorPhone: "9876543214",
        amount: "25000",
        paymentMode: "cheque",
        transactionId: "CHQ001234",
        collectedBy: admin.id,
        donationDate: "2026-02-12",
      },
      {
        clubId: club.id,
        eventId: event2.id,
        donorName: "Pharma Corp Ltd",
        donorEmail: "contact@pharmacorp.com",
        amount: "50000",
        paymentMode: "bank_transfer",
        transactionId: "TXN123456",
        notes: "Corporate CSR contribution",
        collectedBy: admin.id,
        donationDate: "2026-02-15",
      },
      // Education Drive donations
      {
        clubId: club.id,
        eventId: event3.id,
        donorName: "Ravi Gupta",
        donorEmail: "ravi.gupta@gmail.com",
        amount: "12000",
        paymentMode: "upi",
        transactionId: "UPI888999000",
        collectedBy: coordinator.id,
        donationDate: "2026-01-10",
      },
      {
        clubId: club.id,
        eventId: event3.id,
        donorName: "Tech Solutions Inc",
        donorEmail: "csr@techsolutions.com",
        amount: "30000",
        paymentMode: "bank_transfer",
        transactionId: "TXN789456",
        collectedBy: coordinator.id,
        donationDate: "2026-01-15",
      },
      // General donations
      {
        clubId: club.id,
        donorName: "Meera Joshi",
        donorEmail: "meera.j@gmail.com",
        amount: "3000",
        paymentMode: "upi",
        collectedBy: coordinator.id,
        donationDate: "2026-02-16",
      },
    ]);

    console.log("✅ Donations created (8)");

    // 5. Create Expenses
    await db.insert(expenses).values([
      // Pending expenses
      {
        clubId: club.id,
        eventId: event1.id,
        title: "Food Supplies - Week 1",
        description: "Rice, dal, vegetables for 100 meal packets",
        amount: "12500",
        category: "food",
        status: "pending",
        submittedBy: coordinator.id,
        expenseDate: "2026-02-01",
      },
      {
        clubId: club.id,
        eventId: event1.id,
        title: "Transportation Cost",
        description: "Van rental for food distribution",
        amount: "3000",
        category: "transport",
        status: "pending",
        submittedBy: coordinator.id,
        expenseDate: "2026-02-05",
      },
      {
        clubId: club.id,
        eventId: event2.id,
        title: "Medical Supplies",
        description: "Basic medicines, first aid kits",
        amount: "15000",
        category: "medical",
        status: "pending",
        submittedBy: treasurer.id,
        expenseDate: "2026-02-10",
      },
      // Approved expenses
      {
        clubId: club.id,
        eventId: event3.id,
        title: "School Supplies Purchase",
        description: "Notebooks, pens, bags for 200 students",
        amount: "45000",
        category: "supplies",
        status: "approved",
        submittedBy: coordinator.id,
        approvedBy: admin.id,
        expenseDate: "2026-01-18",
      },
      {
        clubId: club.id,
        eventId: event3.id,
        title: "Distribution Event Cost",
        description: "Venue, refreshments, volunteers",
        amount: "8000",
        category: "other",
        status: "approved",
        submittedBy: coordinator.id,
        approvedBy: treasurer.id,
        expenseDate: "2026-01-20",
      },
    ]);

    console.log("✅ Expenses created (5)");

    console.log("\n🎉 Seed completed successfully!");
    console.log("\n📊 Summary:");
    console.log("  - 1 Club");
    console.log("  - 3 Members (admin, treasurer, coordinator)");
    console.log("  - 3 Events");
    console.log("  - 8 Donations (₹1,37,500)");
    console.log("  - 5 Expenses (₹83,500)");
    console.log("\n🔐 Test Accounts:");
    console.log("  👑 Admin: vijaykumartholeti2005@gmail.com");
    console.log("  💰 Treasurer: treasurer@streetcause.org");
    console.log("  📋 Coordinator: coordinator@streetcause.org");
    console.log("\n✅ Sign up with any of these emails via Clerk to link your account!");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }

  process.exit(0);
}

seedWithMembers();
