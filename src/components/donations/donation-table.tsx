"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowUpDown, MoreHorizontal, Eye, Droplets, Pencil, RefreshCw, Clock, XCircle, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Donation {
  id: string;
  donorName: string;
  donorEmail?: string | null;
  donorPhone?: string | null;
  amount: string;
  paymentMode: string;
  transactionId?: string | null;
  screenshotUrl?: string | null;
  donationDate: string;
  notes?: string | null;
  bloodGroup?: string | null;
  canContactForBlood?: boolean | null;
  event?: { name: string } | null;
  status?: string | null;
  rejectionReason?: string | null;
  collectedBy?: string | null;
  submitter?: { fullName: string } | null;
}

interface DonationTableProps {
  donations: Donation[];
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
  onViewDetails: (donation: Donation) => void;
  onEdit: (donation: Donation) => void;
  isAdmin: boolean;
  currentMemberId?: string;
  currentRole?: string;
  onResubmit?: (id: string) => void;
}

const paymentModeLabels: Record<string, string> = {
  upi: "UPI",
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  other: "Other",
};

const paymentModeColors: Record<string, string> = {
  upi: "bg-[#E6F2FF] text-[#0066FF] border-[#0066FF]",
  cash: "bg-[#D1FAE5] text-[#10B981] border-[#10B981]",
  bank_transfer: "bg-[#F5F3FF] text-[#8B5CF6] border-[#8B5CF6]",
  cheque: "bg-[#FFF3EE] text-[#FF6B35] border-[#FF6B35]",
  other: "bg-gray-100 text-gray-700 border-gray-300",
};

const bloodGroupColors: Record<string, string> = {
  "A+": "bg-red-50 text-red-600 border-red-300",
  "A-": "bg-red-50 text-red-700 border-red-400",
  "B+": "bg-orange-50 text-orange-600 border-orange-300",
  "B-": "bg-orange-50 text-orange-700 border-orange-400",
  "AB+": "bg-purple-50 text-purple-600 border-purple-300",
  "AB-": "bg-purple-50 text-purple-700 border-purple-400",
  "O+": "bg-blue-50 text-blue-600 border-blue-300",
  "O-": "bg-blue-50 text-blue-700 border-blue-400",
};

export function DonationTable({
  donations,
  sortColumn,
  sortDirection,
  onSort,
  onViewDetails,
  onEdit,
  isAdmin,
  currentMemberId,
  currentRole,
  onResubmit,
}: DonationTableProps) {
  const isCoordinator = currentRole && !["admin", "treasurer"].includes(currentRole);

  const SortButton = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-1 font-semibold text-gray-700 hover:text-[#0066FF] transition-colors"
    >
      {children}
      <ArrowUpDown className={`h-4 w-4 ${sortColumn === column ? "text-[#0066FF]" : "text-gray-400"}`} />
    </button>
  );

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs uppercase tracking-wider">
                <SortButton column="donorName">Donor Details</SortButton>
              </th>
              <th className="px-6 py-4 text-left text-xs uppercase tracking-wider">
                <SortButton column="amount">Amount</SortButton>
              </th>
              <th className="px-6 py-4 text-left text-xs uppercase tracking-wider">Payment Mode</th>
              <th className="px-6 py-4 text-left text-xs uppercase tracking-wider">
                <SortButton column="donationDate">Date</SortButton>
              </th>
              <th className="px-6 py-4 text-left text-xs uppercase tracking-wider">Event</th>
              <th className="px-6 py-4 text-right text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {donations.map((donation, idx) => {
              const isPending = donation.status === "pending";
              const isRejected = donation.status === "rejected";
              const isOwn = donation.collectedBy === currentMemberId;
              const canResubmit = isRejected && isOwn && isCoordinator && onResubmit;

              return (
                <tr
                  key={donation.id}
                  className={`hover:bg-gray-50 transition-colors group cursor-pointer ${
                    isPending ? "bg-amber-50/50" : isRejected ? "bg-red-50/40" : ""
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  onClick={() => onViewDetails(donation)}
                >
                  {/* Donor Details */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 ${
                        isPending
                          ? "bg-amber-100 border-amber-400"
                          : isRejected
                          ? "bg-red-100 border-red-400"
                          : "bg-[#D1FAE5] border-[#10B981]"
                      }`}>
                        <span className={`text-sm font-bold ${
                          isPending ? "text-amber-700" : isRejected ? "text-red-700" : "text-[#10B981]"
                        }`}>
                          {donation.donorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{donation.donorName}</p>
                        {donation.donorEmail && (
                          <p className="text-xs text-gray-500">{donation.donorEmail}</p>
                        )}
                        {donation.donorPhone && (
                          <p className="text-xs text-gray-500">{donation.donorPhone}</p>
                        )}
                        {/* Status badges for coordinator's own submissions */}
                        {isPending && isOwn && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-amber-600" />
                            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-300">
                              Pending Review
                            </span>
                          </div>
                        )}
                        {isRejected && isOwn && (
                          <div className="mt-1 space-y-0.5">
                            <div className="flex items-center gap-1">
                              <XCircle className="h-3 w-3 text-red-500" />
                              <span className="text-xs font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full border border-red-300">
                                Rejected
                              </span>
                            </div>
                            {donation.rejectionReason && (
                              <p className="text-xs text-red-600 italic max-w-[200px] truncate">
                                "{donation.rejectionReason}"
                              </p>
                            )}
                          </div>
                        )}
                        {/* Blood Group Badge */}
                        {donation.bloodGroup && (
                          <div className="flex items-center gap-1 mt-1">
                            <Droplets className="h-3 w-3 text-red-400" />
                            <Badge
                              className={`${bloodGroupColors[donation.bloodGroup]} border text-xs py-0 px-1.5 font-bold`}
                            >
                              {donation.bloodGroup}
                            </Badge>
                            {donation.canContactForBlood && (
                              <span className="text-xs text-green-600 font-medium">· available</span>
                            )}
                          </div>
                        )}
                        {/* Added by */}
                        {donation.submitter?.fullName && (
                          <div className="flex items-center gap-1 mt-1">
                            <User className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              Added by <span className="font-semibold text-gray-700">{donation.submitter.fullName}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4">
                    <p className={`text-lg font-bold ${isRejected ? "text-red-500" : isPending ? "text-amber-600" : "text-[#10B981]"}`}>
                      {formatCurrency(Number(donation.amount))}
                    </p>
                    {donation.transactionId && (
                      <p className="text-xs text-gray-500 font-mono">ID: {donation.transactionId}</p>
                    )}
                    {donation.screenshotUrl && (
                      <p className="text-xs text-blue-500 mt-0.5">📎 Receipt</p>
                    )}
                  </td>

                  {/* Payment Mode */}
                  <td className="px-6 py-4">
                    <Badge className={`${paymentModeColors[donation.paymentMode]} border font-semibold`}>
                      {paymentModeLabels[donation.paymentMode]}
                    </Badge>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 font-medium">
                      {formatDate(donation.donationDate)}
                    </p>
                  </td>

                  {/* Event */}
                  <td className="px-6 py-4">
                    {donation.event ? (
                      <Badge variant="outline" className="font-medium border-[#8B5CF6] text-[#8B5CF6]">
                        {donation.event.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-400">General Fund</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => onViewDetails(donation)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Quick View
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem
                            className="cursor-pointer text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                            onClick={() => onEdit(donation)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canResubmit && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="cursor-pointer text-amber-600 focus:text-amber-700 focus:bg-amber-50"
                              onClick={() => onResubmit(donation.id)}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Resubmit for Review
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {donations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 font-medium">No donations found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
