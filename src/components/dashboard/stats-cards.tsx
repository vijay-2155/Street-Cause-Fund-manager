import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Wallet, AlertCircle } from "lucide-react";
import type { FundSummary } from "@/types";

interface StatsCardsProps {
  summary: FundSummary;
}

export function StatsCards({ summary }: StatsCardsProps) {
  const stats = [
    {
      name: "Total Donations",
      value: `₹${summary.total_donations.toLocaleString("en-IN")}`,
      subtext: `${summary.donation_count} donation${summary.donation_count !== 1 ? "s" : ""}`,
      icon: DollarSign,
      bgColor: "bg-[#D1FAE5]",
      iconColor: "text-[#10B981]",
      borderColor: "border-[#10B981]",
    },
    {
      name: "Total Expenses",
      value: `₹${summary.total_expenses.toLocaleString("en-IN")}`,
      subtext: `${summary.expense_count} expense${summary.expense_count !== 1 ? "s" : ""} approved`,
      icon: TrendingUp,
      bgColor: "bg-[#F5F3FF]",
      iconColor: "text-[#8B5CF6]",
      borderColor: "border-[#8B5CF6]",
    },
    {
      name: "Current Balance",
      value: `₹${summary.balance.toLocaleString("en-IN")}`,
      subtext: "Available funds",
      icon: Wallet,
      bgColor: "bg-[#ECFEFF]",
      iconColor: "text-[#06B6D4]",
      borderColor: "border-[#06B6D4]",
    },
    {
      name: "Pending Approvals",
      value: `₹${summary.pending_expenses.toLocaleString("en-IN")}`,
      subtext: "Awaiting review",
      icon: AlertCircle,
      bgColor: "bg-[#FFF3EE]",
      iconColor: "text-[#FF6B35]",
      borderColor: "border-[#FF6B35]",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.name} className={`border-2 ${stat.borderColor} shadow-lg hover:shadow-xl transition-all hover:scale-105`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500">
                  {stat.subtext}
                </p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-xl`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
