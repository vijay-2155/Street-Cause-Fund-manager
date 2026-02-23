"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Tag,
  FileText,
  Droplets,
  ImageIcon,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

interface DonationQuickViewProps {
  donation: Donation | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (donation: Donation) => void;
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

export function DonationQuickView({ donation, open, onClose, onEdit }: DonationQuickViewProps) {
  const [imageExpanded, setImageExpanded] = useState(false);

  if (!donation) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#D1FAE5] to-white px-6 pt-6 pb-4 border-b-2 border-gray-100">
          <DialogHeader>
            <DialogTitle asChild>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-[#10B981] shadow-sm">
                    <span className="text-lg font-bold text-[#10B981]">
                      {donation.donorName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-bold text-lg leading-tight">{donation.donorName}</p>
                    <p className="text-2xl font-bold text-[#10B981]">
                      {formatCurrency(Number(donation.amount))}
                    </p>
                  </div>
                </div>
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 font-semibold shrink-0"
                    onClick={() => {
                      onClose();
                      onEdit(donation);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Donor Info */}
          {(donation.donorEmail || donation.donorPhone) && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
                Donor Info
              </h4>
              {donation.donorEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-700">{donation.donorEmail}</span>
                </div>
              )}
              {donation.donorPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-700">{donation.donorPhone}</span>
                </div>
              )}
            </div>
          )}

          {/* Donation Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
              Donation Details
            </h4>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CreditCard className="h-4 w-4 text-gray-400" />
                Payment Mode
              </div>
              <Badge className={`${paymentModeColors[donation.paymentMode]} border font-semibold`}>
                {paymentModeLabels[donation.paymentMode]}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4 text-gray-400" />
                Date
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formatDate(donation.donationDate)}
              </span>
            </div>

            {donation.transactionId && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
                  <Tag className="h-4 w-4 text-gray-400" />
                  Transaction ID
                </div>
                <span className="text-sm font-mono text-gray-900 truncate">{donation.transactionId}</span>
              </div>
            )}

            {donation.event && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Event
                </div>
                <Badge variant="outline" className="border-[#8B5CF6] text-[#8B5CF6] font-medium">
                  {donation.event.name}
                </Badge>
              </div>
            )}

            {donation.notes && (
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-gray-700">{donation.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Blood Donation Info */}
          {(donation.bloodGroup || donation.canContactForBlood) && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-red-400 mb-3 flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Blood Donation Info
              </h4>
              {donation.bloodGroup && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Blood Group</span>
                  <Badge className={`${bloodGroupColors[donation.bloodGroup]} border font-bold text-base px-3 py-1`}>
                    {donation.bloodGroup}
                  </Badge>
                </div>
              )}
              {donation.canContactForBlood && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-2">
                  <span className="text-green-500 text-base">✓</span>
                  Available for blood emergencies
                </div>
              )}
            </div>
          )}

          {/* Payment Screenshot / Bill */}
          {donation.screenshotUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Payment Screenshot
                </h4>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setImageExpanded(!imageExpanded)}
                    title={imageExpanded ? "Collapse" : "Expand"}
                  >
                    {imageExpanded ? (
                      <ZoomOut className="h-3.5 w-3.5 text-gray-500" />
                    ) : (
                      <ZoomIn className="h-3.5 w-3.5 text-gray-500" />
                    )}
                  </Button>
                  <a
                    href={donation.screenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                  </a>
                </div>
              </div>
              <div
                className="border-2 border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-[#10B981] transition-colors"
                onClick={() => setImageExpanded(!imageExpanded)}
              >
                <img
                  src={donation.screenshotUrl}
                  alt="Payment screenshot"
                  className={`w-full object-contain bg-gray-50 transition-all duration-300 ${
                    imageExpanded ? "max-h-[600px]" : "max-h-52"
                  }`}
                />
              </div>
              <p className="text-xs text-gray-400 text-center">
                Click image to {imageExpanded ? "collapse" : "expand"} · Open icon for full view
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}