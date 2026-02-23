"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, DollarSign, Users, Calendar } from "lucide-react";

interface DonationStatsProps {
  totalAmount: number;
  totalDonations: number;
  avgDonation: number;
  thisMonthAmount: number;
  growthPercentage: number;
}

export function DonationStats({
  totalAmount,
  totalDonations,
  avgDonation,
  thisMonthAmount,
  growthPercentage,
}: DonationStatsProps) {
  const stats = [
    {
      title: "Total Donations",
      value: formatCurrency(totalAmount),
      icon: DollarSign,
      color: "bg-[#10B981]",
      lightColor: "bg-[#D1FAE5]",
      textColor: "text-[#10B981]",
    },
    {
      title: "Total Count",
      value: totalDonations.toString(),
      subtext: "donations received",
      icon: Users,
      color: "bg-[#0066FF]",
      lightColor: "bg-[#E6F2FF]",
      textColor: "text-[#0066FF]",
    },
    {
      title: "Average Donation",
      value: formatCurrency(avgDonation),
      icon: TrendingUp,
      color: "bg-[#8B5CF6]",
      lightColor: "bg-[#F5F3FF]",
      textColor: "text-[#8B5CF6]",
    },
    {
      title: "This Month",
      value: formatCurrency(thisMonthAmount),
      subtext: `${growthPercentage >= 0 ? "+" : ""}${growthPercentage}% from last month`,
      icon: Calendar,
      color: "bg-[#FF6B35]",
      lightColor: "bg-[#FFF3EE]",
      textColor: "text-[#FF6B35]",
      growth: growthPercentage,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <Card
          key={stat.title}
          className="border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg group"
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {stat.title}
                </p>
                <p className={`text-3xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
                {stat.subtext && (
                  <p className="text-xs text-gray-500 font-medium">
                    {stat.subtext}
                  </p>
                )}
              </div>
              <div className={`${stat.lightColor} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
