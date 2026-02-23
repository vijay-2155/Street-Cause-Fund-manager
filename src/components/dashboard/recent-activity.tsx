import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Transaction {
  id: string;
  type: "donation" | "expense";
  title: string;
  amount: number;
  date: string;
  status?: string;
}

interface RecentActivityProps {
  transactions: Transaction[];
}

export function RecentActivity({ transactions }: RecentActivityProps) {
  return (
    <Card className="shadow-lg border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
        <Link href="/reports">
          <Button variant="ghost" size="sm" className="text-[#0066FF] hover:text-[#0052CC] hover:bg-[#E6F2FF] font-medium">
            View All →
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={`flex-shrink-0 p-2.5 rounded-lg ${
                    transaction.type === "donation"
                      ? "bg-[#D1FAE5] border border-[#10B981]"
                      : "bg-[#F5F3FF] border border-[#8B5CF6]"
                  }`}
                >
                  {transaction.type === "donation" ? (
                    <ArrowUpRight className="h-4 w-4 text-[#10B981]" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-[#8B5CF6]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {transaction.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(transaction.date), {
                        addSuffix: true,
                      })}
                    </p>
                    {transaction.status && (
                      <Badge
                        variant={
                          transaction.status === "approved"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {transaction.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                <p
                  className={`text-sm font-bold ${
                    transaction.type === "donation"
                      ? "text-[#10B981]"
                      : "text-[#8B5CF6]"
                  }`}
                >
                  {transaction.type === "donation" ? "+" : "-"}₹
                  {transaction.amount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
