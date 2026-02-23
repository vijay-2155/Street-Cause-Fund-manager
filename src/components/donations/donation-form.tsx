"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { donationSchema, type DonationFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/shared/file-upload";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Save, Users, Droplet, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { getEventsForSelect } from "@/app/actions/donations";
import { createClient } from "@/lib/supabase/client";

interface DonationFormProps {
  onSubmit: (data: DonationFormData, screenshotUrl?: string) => Promise<void>;
  initialData?: Partial<DonationFormData>;
  onCancel?: () => void;
  existingScreenshotUrl?: string;
  submitLabel?: string;
}

type UploadState = "idle" | "uploading" | "done" | "error";

export function DonationForm({ onSubmit, initialData, onCancel, existingScreenshotUrl, submitLabel = "Save Donation" }: DonationFormProps) {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [screenshotUrl, setScreenshotUrl] = useState<string | undefined>(existingScreenshotUrl);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const uploadPromiseRef = useRef<Promise<string | null> | null>(null);
  const [lastDonor, setLastDonor] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
    setFocus,
  } = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    mode: "onChange", // Real-time validation
    defaultValues: {
      payment_mode: "upi",
      donation_date: format(new Date(), "yyyy-MM-dd"),
      can_contact_for_blood: false,
      ...initialData,
    },
  });

  const paymentMode = watch("payment_mode");
  const eventId = watch("event_id");
  const bloodGroup = watch("blood_group");
  const canContactForBlood = watch("can_contact_for_blood");
  const donorName = watch("donor_name");

  // Check if payment mode requires screenshot
  const requiresScreenshot = ["upi", "bank_transfer"].includes(paymentMode || "");

  // Auto-focus first field on mount
  useEffect(() => {
    setTimeout(() => setFocus("donor_name"), 100);
  }, [setFocus]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await getEventsForSelect();
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const uploadToSupabase = async (file: File): Promise<string | null> => {
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("donation-screenshots")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("donation-screenshots")
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleFileSelect = (file: File) => {
    setScreenshotUrl(undefined);
    setUploadState("uploading");

    const promise = uploadToSupabase(file)
      .then((url) => {
        setScreenshotUrl(url || undefined);
        setUploadState("done");
        return url;
      })
      .catch((err) => {
        console.error("Upload failed:", err);
        setUploadState("error");
        toast.error("Screenshot upload failed — please try again");
        return null;
      });

    uploadPromiseRef.current = promise;
  };

  const handleFileRemove = () => {
    setScreenshotUrl(existingScreenshotUrl);
    setUploadState("idle");
    uploadPromiseRef.current = null;
  };

  const handleFormSubmit = async (data: DonationFormData) => {
    let finalUrl = screenshotUrl;

    // If still uploading, wait for it to finish
    if (uploadState === "uploading" && uploadPromiseRef.current) {
      const toastId = toast.loading("Waiting for screenshot upload…");
      const result = await uploadPromiseRef.current;
      toast.dismiss(toastId);
      if (!result) {
        toast.error("Screenshot upload failed — please re-upload");
        return;
      }
      finalUrl = result;
    }

    if (uploadState === "error" && requiresScreenshot && !finalUrl) {
      toast.error("Please re-upload the screenshot before saving");
      return;
    }

    if (requiresScreenshot && !finalUrl) {
      toast.error("Payment screenshot is required for UPI and Bank Transfer");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(data, finalUrl);

      // Store last donor name for quick reference
      setLastDonor(data.donor_name);

      toast.success(
        `✅ Donation from ${data.donor_name} recorded successfully!`,
        {
          duration: 4000,
          description: `₹${data.amount} via ${data.payment_mode.toUpperCase()}`
        }
      );

      // Optional: Ask if they want to add another donation
      setTimeout(() => {
        toast.info("Add another donation? The form is ready.", {
          duration: 3000,
        });
      }, 1500);

    } catch (error: any) {
      toast.error(error.message || "Failed to add donation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Donor Information Section */}
      <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border-2 border-green-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl shadow-md">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Donor Information</h3>
            <p className="text-xs text-gray-600">Enter donor's contact details</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="donor_name" className="text-sm font-bold text-gray-800 flex items-center gap-1">
              Donor Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="donor_name"
              {...register("donor_name")}
              placeholder="Enter donor's full name"
              disabled={loading}
              autoComplete="name"
              autoFocus
              className="h-12 bg-white border-2 border-gray-300 focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 font-medium text-base shadow-sm"
            />
            {errors.donor_name && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.donor_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="donor_email" className="text-sm font-bold text-gray-800">
              Email <span className="text-gray-400 font-normal">(Optional)</span>
            </Label>
            <Input
              id="donor_email"
              type="email"
              {...register("donor_email")}
              placeholder="donor@email.com"
              disabled={loading}
              autoComplete="email"
              inputMode="email"
              className="h-12 bg-white border-2 border-gray-300 focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 shadow-sm"
            />
            {errors.donor_email && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.donor_email.message}
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="donor_phone" className="text-sm font-bold text-gray-800">
              Phone <span className="text-gray-400 font-normal">(Optional)</span>
              {canContactForBlood && (
                <span className="text-red-600 ml-2 font-semibold">• Required for blood emergencies</span>
              )}
            </Label>
            <Input
              id="donor_phone"
              type="tel"
              {...register("donor_phone")}
              placeholder="9876543210 or +91 98765 43210"
              disabled={loading}
              autoComplete="tel"
              inputMode="tel"
              className="h-12 bg-white border-2 border-gray-300 focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Donation Details Section */}
      <div className="bg-gradient-to-br from-cyan-50 to-white rounded-xl border-2 border-cyan-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-[#06B6D4] to-[#0891B2] rounded-xl shadow-md">
            <Save className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Donation Details</h3>
            <p className="text-xs text-gray-600">Payment information and amount</p>
          </div>
        </div>
        <div className="space-y-6">
          {/* Amount Field - Full Width */}
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-sm font-bold text-gray-800 flex items-center gap-1">
              Amount (₹) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-xl">₹</span>
              <Input
                id="amount"
                type="number"
                step="1"
                min="1"
                {...register("amount", { valueAsNumber: true })}
                placeholder="1000"
                disabled={loading}
                inputMode="numeric"
                autoComplete="transaction-amount"
                className="h-14 pl-10 pr-4 bg-white border-2 border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 font-bold text-2xl shadow-sm"
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.amount.message}
              </p>
            )}
            {watch("amount") > 0 && !errors.amount && (
              <p className="text-sm text-green-700 font-semibold bg-green-50 px-3 py-1.5 rounded-lg inline-block">
                ✓ Amount: ₹{watch("amount")?.toLocaleString('en-IN')}
              </p>
            )}
          </div>

          {/* Quick Amount Buttons - Prominent */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Quick Select</Label>
            <div className="grid grid-cols-5 gap-3">
              {[100, 500, 1000, 2000, 5000].map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  onClick={() => setValue("amount", amount)}
                  disabled={loading}
                  className={`h-12 font-bold text-base border-2 transition-all ${
                    watch("amount") === amount
                      ? "bg-cyan-500 text-white border-cyan-600 shadow-md"
                      : "bg-white hover:bg-cyan-50 hover:border-cyan-400 border-gray-300"
                  }`}
                >
                  ₹{amount}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Mode and Other Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="space-y-2">
              <Label htmlFor="payment_mode" className="text-sm font-bold text-gray-800 flex items-center gap-1">
                Payment Mode <span className="text-red-500">*</span>
              </Label>
              <Select
                value={paymentMode}
                onValueChange={(value) => {
                  setValue("payment_mode", value as any);
                }}
                disabled={loading}
              >
                <SelectTrigger className="h-12 bg-white border-2 border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">💳 UPI (Screenshot Required)</SelectItem>
                  <SelectItem value="cash">💵 Cash</SelectItem>
                  <SelectItem value="bank_transfer">🏦 Bank Transfer (Screenshot Required)</SelectItem>
                  <SelectItem value="cheque">📝 Cheque</SelectItem>
                  <SelectItem value="other">📌 Other</SelectItem>
                </SelectContent>
              </Select>
              {requiresScreenshot && !screenshotUrl && uploadState === "idle" && (
                <p className="text-xs text-orange-700 font-semibold flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-lg">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Screenshot required - upload below
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="donation_date" className="text-sm font-bold text-gray-800 flex items-center gap-1">
                Donation Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="donation_date"
                type="date"
                {...register("donation_date")}
                disabled={loading}
                className="h-12 bg-white border-2 border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction_id" className="text-sm font-bold text-gray-800">
              Transaction ID <span className="text-gray-400 font-normal">(Optional)</span>
            </Label>
            <Input
              id="transaction_id"
              {...register("transaction_id")}
              placeholder={
                paymentMode === "upi" ? "UPI Ref: 123456789012" :
                paymentMode === "bank_transfer" ? "NEFT/IMPS Ref Number" :
                paymentMode === "cheque" ? "Cheque Number" :
                "Reference Number"
              }
              disabled={loading}
              autoComplete="off"
              className="h-12 bg-white border-2 border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 font-mono shadow-sm"
            />
          </div>

          {/* Payment Screenshot Upload - Prominent */}
          {requiresScreenshot ? (
            <div className="md:col-span-2 space-y-3 bg-orange-50 border-2 border-orange-300 rounded-xl p-5">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <Label className="text-base font-bold text-gray-900">
                  Payment Screenshot <span className="text-red-500">*</span>
                </Label>
                {uploadState === "uploading" && (
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                  </span>
                )}
                {uploadState === "done" && (
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-green-700 font-semibold bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                    <CheckCircle2 className="h-3 w-3" /> Uploaded
                  </span>
                )}
                {uploadState === "error" && (
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-red-700 font-semibold bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                    <XCircle className="h-3 w-3" /> Upload failed
                  </span>
                )}
              </div>
              <p className="text-sm text-orange-800 font-medium">
                📸 Screenshot is required for {paymentMode === "upi" ? "UPI" : "Bank Transfer"} payments
              </p>
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                maxSizeMB={2}
                preview={existingScreenshotUrl}
              />
            </div>
          ) : (
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-bold text-gray-800">
                  Payment Screenshot <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                {uploadState === "uploading" && (
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                  </span>
                )}
                {uploadState === "done" && (
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-green-700 font-semibold bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                    <CheckCircle2 className="h-3 w-3" /> Uploaded
                  </span>
                )}
              </div>
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                maxSizeMB={2}
                preview={existingScreenshotUrl}
              />
            </div>
          )}

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="event_id" className="text-sm font-bold text-gray-800">
              Event <span className="text-gray-400 font-normal">(Optional)</span>
            </Label>
            <Select
              value={eventId || undefined}
              onValueChange={(value) => setValue("event_id", value)}
              disabled={loading}
            >
              <SelectTrigger className="h-12 bg-white border-2 border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-sm">
                <SelectValue placeholder="General Fund (No specific event)" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="notes" className="text-sm font-bold text-gray-800">
              Notes <span className="text-gray-400 font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Any additional information about this donation..."
              rows={4}
              disabled={loading}
              className="bg-white border-2 border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 resize-none shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Blood Donation Information Section */}
      <div className="bg-gradient-to-br from-red-50 to-white rounded-xl border-2 border-red-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#EF4444] to-[#DC2626] rounded-xl shadow-md">
              <Droplet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Blood Donation Info</h3>
              <p className="text-xs text-gray-600">Help save lives in emergencies</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wide">Optional</span>
        </div>

        <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-r-xl mb-6 shadow-sm">
          <div className="flex gap-3">
            <AlertCircle className="h-6 w-6 text-blue-700 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-bold mb-1.5">💝 Help Save Lives!</p>
              <p className="leading-relaxed">If you're willing to donate blood in emergencies, please share your blood group. We'll reach out via WhatsApp only when there's an urgent need.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="blood_group" className="text-sm font-bold text-gray-800">
              Blood Group
            </Label>
            <Select
              value={bloodGroup || undefined}
              onValueChange={(value) => setValue("blood_group", value as any)}
              disabled={loading}
            >
              <SelectTrigger className="h-12 bg-white border-2 border-gray-300 focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20 shadow-sm font-semibold text-base">
                <SelectValue placeholder="Select your blood group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">🩸 A+</SelectItem>
                <SelectItem value="A-">🩸 A-</SelectItem>
                <SelectItem value="B+">🩸 B+</SelectItem>
                <SelectItem value="B-">🩸 B-</SelectItem>
                <SelectItem value="AB+">🩸 AB+</SelectItem>
                <SelectItem value="AB-">🩸 AB-</SelectItem>
                <SelectItem value="O+">🩸 O+</SelectItem>
                <SelectItem value="O-">🩸 O-</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex items-end">
            <div className="bg-white border-2 border-gray-300 rounded-lg p-4 w-full hover:border-red-400 transition-colors">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="can_contact_for_blood"
                  checked={canContactForBlood}
                  onCheckedChange={(checked) => setValue("can_contact_for_blood", checked as boolean)}
                  disabled={loading}
                  className="mt-0.5 h-5 w-5 border-2 border-gray-400 data-[state=checked]:bg-[#EF4444] data-[state=checked]:border-[#EF4444]"
                />
                <Label
                  htmlFor="can_contact_for_blood"
                  className="text-sm font-semibold text-gray-800 cursor-pointer leading-tight"
                >
                  ✅ Yes, contact me for blood emergencies via WhatsApp
                </Label>
              </div>
            </div>
          </div>
        </div>

        {canContactForBlood && !watch("donor_phone") && (
          <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm">
            <div className="flex gap-2 items-start">
              <AlertCircle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 font-medium">
                <strong>⚠️ Important:</strong> Please provide your phone number in the Donor Information section above so we can reach you via WhatsApp for emergencies.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white sticky bottom-0 -mx-6 -mb-6 px-6 py-5 border-t-2 border-gray-200 rounded-b-xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-sm">
            {uploadState === "uploading" ? (
              <div className="flex items-center gap-2 bg-blue-100 px-4 py-2.5 rounded-lg border border-blue-300">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
                <span className="text-blue-900 font-semibold">Uploading screenshot…</span>
              </div>
            ) : uploadState === "error" && requiresScreenshot ? (
              <div className="flex items-center gap-2 bg-red-100 px-4 py-2.5 rounded-lg border border-red-300">
                <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="text-red-900 font-semibold">Upload failed — please re-upload screenshot</span>
              </div>
            ) : requiresScreenshot && !screenshotUrl ? (
              <div className="flex items-center gap-2 bg-orange-100 px-4 py-2.5 rounded-lg border border-orange-300">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <span className="text-orange-900 font-semibold">Screenshot required before saving</span>
              </div>
            ) : Object.keys(errors).length === 0 ? (
              <div className="flex items-center gap-2 bg-green-100 px-4 py-2.5 rounded-lg border border-green-300">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-green-900 font-semibold">Form looks good!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-red-100 px-4 py-2.5 rounded-lg border border-red-300">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="text-red-900 font-semibold">Please fix errors above</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="h-12 px-6 border-2 border-gray-400 hover:bg-gray-100 font-semibold flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || uploadState === "uploading" || (requiresScreenshot && !screenshotUrl)}
              className="h-12 px-8 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white shadow-xl font-bold text-base flex-1 sm:flex-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  {submitLabel}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
