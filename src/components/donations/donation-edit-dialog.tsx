"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DonationForm } from "@/components/donations/donation-form";
import { updateDonation } from "@/app/actions/donations";
import type { DonationFormData } from "@/lib/validations";
import { Pencil } from "lucide-react";

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
  eventId?: string | null;
}

interface DonationEditDialogProps {
  donation: Donation | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function DonationEditDialog({
  donation,
  open,
  onClose,
  onSaved,
}: DonationEditDialogProps) {
  if (!donation) return null;

  const handleSubmit = async (data: DonationFormData, screenshotUrl?: string) => {
    await updateDonation(donation.id, {
      donor_name: data.donor_name,
      donor_email: data.donor_email,
      donor_phone: data.donor_phone,
      amount: data.amount.toString(),
      payment_mode: data.payment_mode,
      transaction_id: data.transaction_id,
      notes: data.notes,
      event_id: data.event_id,
      donation_date: data.donation_date,
      screenshot_url: screenshotUrl,
      blood_group: data.blood_group,
      can_contact_for_blood: data.can_contact_for_blood,
    });

    onSaved();
    onClose();
  };

  // Map DB field names to form field names
  const initialData: Partial<DonationFormData> = {
    donor_name: donation.donorName,
    donor_email: donation.donorEmail || "",
    donor_phone: donation.donorPhone || "",
    amount: Number(donation.amount),
    payment_mode: donation.paymentMode as any,
    transaction_id: donation.transactionId || "",
    donation_date: donation.donationDate,
    notes: donation.notes || "",
    blood_group: (donation.bloodGroup as any) || undefined,
    can_contact_for_blood: donation.canContactForBlood || false,
    event_id: (donation as any).eventId || "",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#D1FAE5] to-white px-6 pt-6 pb-4 border-b-2 border-gray-100 sticky top-0 z-10">
          <DialogHeader>
            <DialogTitle asChild>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-[#10B981] to-[#059669] p-2.5 rounded-xl shadow-md">
                  <Pencil className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-gray-900 font-bold text-lg leading-tight">Edit Donation</p>
                  <p className="text-sm text-gray-500 font-normal">
                    Editing donation from <span className="font-semibold text-gray-700">{donation.donorName}</span>
                  </p>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 py-4">
          <DonationForm
            onSubmit={handleSubmit}
            initialData={initialData}
            existingScreenshotUrl={donation.screenshotUrl || undefined}
            onCancel={onClose}
            submitLabel="Save Changes"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
