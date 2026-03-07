"use server";

import { db } from "@/db";
import { donations } from "@/db/schema";
import { eq, and, isNotNull, desc } from "drizzle-orm";
import { getCurrentMember } from "@/lib/auth/helpers";

export async function getBloodDonors() {
  const { member } = await getCurrentMember(); // requires sign-in
  // Fetch all donations where donor agreed to be contacted for blood and has a blood group
  const bloodDonations = await db.query.donations.findMany({
    where: and(
      eq(donations.clubId, member.clubId!),
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

  // Deduplicate: by phone if available, otherwise by name
  // Since ordered by desc(donationDate), the first occurrence is the most recent
  const seenPhones = new Set<string>();
  const seenNames = new Set<string>();
  const uniqueDonors: (typeof bloodDonations)[0][] = [];

  for (const donation of bloodDonations) {
    if (donation.donorPhone) {
      if (!seenPhones.has(donation.donorPhone)) {
        seenPhones.add(donation.donorPhone);
        uniqueDonors.push(donation);
      }
    } else {
      const nameKey = donation.donorName.trim().toLowerCase();
      if (!seenNames.has(nameKey)) {
        seenNames.add(nameKey);
        uniqueDonors.push(donation);
      }
    }
  }

  return uniqueDonors;
}
