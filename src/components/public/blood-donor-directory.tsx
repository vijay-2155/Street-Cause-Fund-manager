"use client";

import { useState } from "react";
import { Search, Droplet, Phone, Calendar, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type BloodDonor = {
  donorName: string;
  bloodGroup: string | null;
  donorPhone: string | null;
  donationDate: string;
};

const BLOOD_GROUPS = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function BloodDonorDirectory({ donors }: { donors: BloodDonor[] }) {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");

  const filteredDonors = donors.filter((donor) => {
    const matchesSearch = donor.donorName.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup === "All" || donor.bloodGroup === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by donor name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 border-2 border-gray-200 focus:border-red-500 focus:ring-red-500/20 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">Filter by Blood Group</label>
          <div className="flex flex-wrap gap-2">
            {BLOOD_GROUPS.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${
                  selectedGroup === group
                    ? "bg-red-500 border-red-500 text-white shadow-md scale-105"
                    : "bg-white border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50/50"
                }`}
              >
                {group !== "All" && <span className="mr-1">🩸</span>}
                {group}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {filteredDonors.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Droplet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900">No donors found</h3>
          <p className="text-gray-500">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredDonors.map((donor, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border-2 border-red-100 hover:border-red-300 p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                    <User className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{donor.donorName}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      Last donated: {new Date(donor.donationDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 px-2.5 py-1 font-bold text-sm shrink-0">
                  {donor.bloodGroup}
                </Badge>
              </div>

              {donor.donorPhone ? (
                <a
                  href={`https://wa.me/91${donor.donorPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 font-bold text-sm rounded-xl transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Contact via WhatsApp
                </a>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-400 font-bold text-sm rounded-xl border border-gray-100">
                  <span className="line-through">Num. Hidden</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
