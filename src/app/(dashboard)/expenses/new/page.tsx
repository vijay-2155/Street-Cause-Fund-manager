"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  Save,
  Receipt,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Tag,
  IndianRupee,
  Paperclip,
  Send,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createExpense, getEventsForSelect } from "@/app/actions/expenses";
import { FileUpload } from "@/components/shared/file-upload";
import { createClient } from "@/lib/supabase/client";

type UploadState = "idle" | "uploading" | "done" | "error";

const CATEGORIES = [
  { value: "food", label: "Food & Refreshments", emoji: "🍱" },
  { value: "supplies", label: "Supplies & Materials", emoji: "📦" },
  { value: "transport", label: "Transportation", emoji: "🚗" },
  { value: "venue", label: "Venue Rental", emoji: "🏛️" },
  { value: "printing", label: "Printing & Stationery", emoji: "🖨️" },
  { value: "medical", label: "Medical Supplies", emoji: "🏥" },
  { value: "donation_forward", label: "Donation Forward", emoji: "💝" },
  { value: "other", label: "Other", emoji: "📌" },
];

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export default function NewExpensePage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>();
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const uploadPromiseRef = useRef<Promise<string | null> | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    category: "other" as const,
    event_id: "",
    expense_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await getEventsForSelect();
      setEvents(data || []);
    } catch (error: any) {
      console.error("Error fetching events:", error);
    }
  };

  const uploadToSupabase = async (file: File): Promise<string | null> => {
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("expense-receipts")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("expense-receipts")
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleFileSelect = (file: File) => {
    setReceiptUrl(undefined);
    setUploadState("uploading");

    const promise = uploadToSupabase(file)
      .then((url) => {
        setReceiptUrl(url || undefined);
        setUploadState("done");
        return url;
      })
      .catch((err) => {
        console.error("Upload failed:", err);
        setUploadState("error");
        toast.error("Bill upload failed — please try again");
        return null;
      });

    uploadPromiseRef.current = promise;
  };

  const handleFileRemove = () => {
    setReceiptUrl(undefined);
    setUploadState("idle");
    uploadPromiseRef.current = null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Expense title is required");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (uploadState === "idle" || uploadState === "error") {
      toast.error("Please upload the bill or receipt before submitting");
      return;
    }

    setSubmitting(true);
    try {
      let finalReceiptUrl = receiptUrl;

      if (uploadState === "uploading" && uploadPromiseRef.current) {
        const toastId = toast.loading("Waiting for bill upload…");
        const result = await uploadPromiseRef.current;
        toast.dismiss(toastId);
        if (!result) {
          toast.error("Bill upload failed — please re-upload");
          setSubmitting(false);
          return;
        }
        finalReceiptUrl = result;
      }

      await createExpense({ ...formData, receipt_url: finalReceiptUrl });
      toast.success("Expense submitted for approval!");
      router.push("/expenses");
    } catch (error: any) {
      console.error("Error submitting expense:", error);
      toast.error(error.message || "Failed to submit expense");
    } finally {
      setSubmitting(false);
    }
  };

  const parsedAmount = parseFloat(formData.amount);
  const amountValid = !isNaN(parsedAmount) && parsedAmount > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/expenses">
          <Button
            variant="outline"
            size="icon"
            className="border-2 border-gray-300 hover:bg-gray-100 h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] p-3 rounded-xl shadow-lg ring-4 ring-[#F5F3FF]">
          <Receipt className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Submit Expense</h1>
          <p className="text-gray-600 mt-0.5 font-medium">Request reimbursement for club expenses</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Section 1: Expense Info ───────────────────────────────────── */}
        <div className="bg-gradient-to-br from-[#F5F3FF] to-white rounded-2xl border-2 border-[#DDD6FE] p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl shadow-md">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Expense Info</h3>
              <p className="text-xs text-gray-500">What did you spend on?</p>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-bold text-gray-800 flex items-center gap-1">
              Expense Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Food & Refreshments for Street Event"
              required
              disabled={submitting}
              className="h-12 bg-white border-2 border-[#DDD6FE] focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 font-medium text-base shadow-sm"
            />
          </div>

          {/* Amount */}
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-sm font-bold text-gray-800 flex items-center gap-1">
              Amount (₹) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 font-bold" />
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                required
                min="1"
                step="0.01"
                disabled={submitting}
                inputMode="numeric"
                className="h-14 pl-11 bg-white border-2 border-[#DDD6FE] focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 font-bold text-2xl shadow-sm"
              />
            </div>
            {amountValid && (
              <p className="text-sm text-[#8B5CF6] font-semibold bg-[#F5F3FF] px-3 py-1.5 rounded-lg inline-block">
                ✓ ₹{parsedAmount.toLocaleString("en-IN")}
              </p>
            )}

            {/* Quick amounts */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Select</Label>
              <div className="grid grid-cols-5 gap-2">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={submitting}
                    onClick={() => setFormData({ ...formData, amount: amt.toString() })}
                    className={`h-11 rounded-xl font-bold text-sm border-2 transition-all ${
                      formData.amount === amt.toString()
                        ? "bg-[#8B5CF6] text-white border-[#7C3AED] shadow-md"
                        : "bg-white hover:bg-[#F5F3FF] hover:border-[#8B5CF6] border-[#DDD6FE] text-gray-700"
                    }`}
                  >
                    ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-gray-800 flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" /> Category <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  disabled={submitting}
                  onClick={() => setFormData({ ...formData, category: cat.value as any })}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all text-left ${
                    formData.category === cat.value
                      ? "bg-[#8B5CF6] text-white border-[#7C3AED] shadow-md"
                      : "bg-white hover:bg-[#F5F3FF] hover:border-[#8B5CF6] border-[#DDD6FE] text-gray-700"
                  }`}
                >
                  <span className="text-base leading-none">{cat.emoji}</span>
                  <span className="leading-tight text-xs">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section 2: Details ────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-cyan-50 to-white rounded-2xl border-2 border-cyan-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#06B6D4] to-[#0891B2] rounded-xl shadow-md">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Details</h3>
              <p className="text-xs text-gray-500">Date, campaign & description</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="expense_date" className="text-sm font-bold text-gray-800">
                Expense Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expense_date"
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                required
                disabled={submitting}
                className="h-12 bg-white border-2 border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-sm"
              />
            </div>

            {/* Campaign */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-800">
                Campaign <span className="text-gray-400 font-normal">(Optional)</span>
              </Label>
              <Select
                value={formData.event_id || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, event_id: value === "none" ? "" : value })
                }
                disabled={submitting}
              >
                <SelectTrigger className="h-12 bg-white border-2 border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-sm">
                  <SelectValue placeholder="General Expense" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General Expense</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-bold text-gray-800">
              Description <span className="text-gray-400 font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide details — what was purchased, for whom, event context…"
              rows={4}
              disabled={submitting}
              className="bg-white border-2 border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 resize-none shadow-sm"
            />
          </div>
        </div>

        {/* ── Section 3: Bill Upload ────────────────────────────────────── */}
        <div className={`rounded-2xl border-2 p-6 shadow-sm space-y-4 transition-colors ${
          uploadState === "done"
            ? "bg-gradient-to-br from-green-50 to-white border-green-300"
            : uploadState === "error"
            ? "bg-gradient-to-br from-red-50 to-white border-red-300"
            : "bg-gradient-to-br from-amber-50 to-white border-amber-300"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl shadow-md transition-colors ${
              uploadState === "done"
                ? "bg-gradient-to-br from-green-500 to-green-600"
                : uploadState === "error"
                ? "bg-gradient-to-br from-red-500 to-red-600"
                : "bg-gradient-to-br from-[#FF6B35] to-[#E55A2B]"
            }`}>
              <Paperclip className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900">Bill / Receipt</h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  uploadState === "done"
                    ? "bg-green-100 text-green-700 border-green-300"
                    : uploadState === "error"
                    ? "bg-red-100 text-red-700 border-red-300"
                    : "bg-red-100 text-red-700 border-red-300"
                }`}>
                  {uploadState === "done" ? "✓ Uploaded" : "Required *"}
                </span>
              </div>
              <p className="text-xs text-gray-500">Attach the bill to help admins approve faster</p>
            </div>

            {/* Upload state badges */}
            {uploadState === "uploading" && (
              <span className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
              </span>
            )}
            {uploadState === "done" && (
              <span className="flex items-center gap-1.5 text-xs text-green-700 font-semibold bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                <CheckCircle2 className="h-3 w-3" /> Uploaded ✓
              </span>
            )}
            {uploadState === "error" && (
              <span className="flex items-center gap-1.5 text-xs text-red-700 font-semibold bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                <XCircle className="h-3 w-3" /> Upload failed
              </span>
            )}
          </div>

          {uploadState === "idle" && (
            <p className="text-sm font-semibold flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              Bill is required — upload a clear photo before submitting
            </p>
          )}
          {uploadState === "error" && (
            <p className="text-sm font-semibold flex items-center gap-2 text-red-800">
              <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              Upload failed — please try again before submitting
            </p>
          )}

          <FileUpload
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            maxSizeMB={2}
          />
        </div>

        {/* ── Sticky Submit Bar ─────────────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 md:left-72 z-50 bg-white/95 backdrop-blur border-t-2 border-gray-200 px-6 py-4 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            {/* Status hint */}
            <div className="text-sm hidden sm:block">
              {uploadState === "uploading" ? (
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  <span className="text-blue-900 font-semibold">Uploading bill…</span>
                </div>
              ) : uploadState === "done" ? (
                <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-green-900 font-semibold">Bill uploaded — ready to submit</span>
                </div>
              ) : (uploadState === "idle" || uploadState === "error") ? (
                <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-700 font-semibold">Upload the bill to continue</span>
                </div>
              ) : amountValid && formData.title.trim() ? (
                <div className="flex items-center gap-2 bg-[#F5F3FF] px-4 py-2 rounded-lg border border-[#DDD6FE]">
                  <CheckCircle2 className="h-4 w-4 text-[#8B5CF6]" />
                  <span className="text-[#7C3AED] font-semibold">Form looks good!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500 font-medium">Fill in title and amount to submit</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 ml-auto">
              <Link href="/expenses">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  className="h-12 px-6 border-2 border-gray-300 hover:bg-gray-100 font-semibold"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting || uploadState === "uploading" || uploadState === "idle" || uploadState === "error"}
                className="h-12 px-8 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white shadow-xl font-bold text-base disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Submit for Approval
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
