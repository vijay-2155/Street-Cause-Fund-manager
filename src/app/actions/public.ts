"use server";

import { db } from "@/db";
import { donations } from "@/db/schema";
import { eq, and, isNotNull, desc } from "drizzle-orm";
import { getCurrentMember } from "@/lib/auth/helpers";

export async function getBloodDonors() {
  await getCurrentMember(); // requires sign-in
  // Fetch all donations where donor agreed to be contacted for blood and has a blood group
  const bloodDonations = await db.query.donations.findMany({
    where: and(
      eq(donations.canContactForBlood, true),
      isNotNull(donations.bloodGroup),
      eq(donations.status, "approved"), // Only approved donations
    ),
    columns: {
      donorName: true,
      bloodGroup: true,
      donorPhone: true,
      donationDate: true,
    },
    orderBy: desc(donations.donationDate),
  });

  // Deduplicate by phone number, keeping the most recent donation date
  const uniqueDonorsMap = new Map<string, (typeof bloodDonations)[0]>();

  for (const donation of bloodDonations) {
    if (donation.donorPhone) {
      // If we haven't seen this phone number before, add it
      // Since it's ordered by desc(donationDate), the first one we see is the most recent
      if (!uniqueDonorsMap.has(donation.donorPhone)) {
        uniqueDonorsMap.set(donation.donorPhone, donation);
      }
    }
  }

  return Array.from(uniqueDonorsMap.values());
}
