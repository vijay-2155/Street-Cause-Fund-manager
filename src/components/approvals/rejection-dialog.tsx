"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  expenseTitle: string;
}

export function RejectionDialog({
  open,
  onOpenChange,
  onConfirm,
  expenseTitle,
}: RejectionDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason || "No reason provided");
    setReason("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900">Reject Expense?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            You're about to reject: <span className="font-semibold text-gray-900">{expenseTitle}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="reason" className="text-sm font-semibold text-gray-700">
            Reason for Rejection
          </Label>
          <Textarea
            id="reason"
            placeholder="Please provide a reason for rejection..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="border-2 border-gray-300 focus:border-[#EF4444] rounded-lg resize-none"
          />
          <p className="text-xs text-gray-500">
            This message will be sent to the person who submitted the expense.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="border-2 border-gray-300">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-lg"
          >
            Reject Expense
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
