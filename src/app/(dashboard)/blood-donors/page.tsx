import type { Metadata } from "next";
import { Droplet } from "lucide-react";
import { getBloodDonors } from "@/app/actions/public";
import { BloodDonorDirectory } from "@/components/public/blood-donor-directory";

export const metadata: Metadata = {
  title: "Blood Donors Directory",
};

export default async function BloodDonorsPage() {
  const donors = await getBloodDonors();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center border border-red-100 ring-4 ring-red-50 shrink-0">
          <Droplet className="w-6 h-6 text-red-500 fill-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Blood Donors</h1>
          <p className="text-sm text-gray-500">
            Donors who have volunteered to be contacted for blood emergencies.
          </p>
        </div>
      </div>

      <BloodDonorDirectory donors={donors} />
    </div>
  );
}
