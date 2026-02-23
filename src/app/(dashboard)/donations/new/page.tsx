"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, ExternalLink, Camera, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { createDonation, getCurrentMemberInfo } from "@/app/actions/donations";
import { DonationForm } from "@/components/donations/donation-form";
import type { DonationFormData } from "@/lib/validations";
import { Clock } from "lucide-react";
import { RAZORPAY_PAYMENT_LINK } from "@/lib/constants";

export default function NewDonationPage() {
  const router = useRouter();
  const [isPrivileged, setIsPrivileged] = useState(true);
  const [razorpayOpened, setRazorpayOpened] = useState(false);
  const [showSteps, setShowSteps] = useState(true);

  useEffect(() => {
    getCurrentMemberInfo().then(({ role }) => {
      setIsPrivileged(["admin", "treasurer"].includes(role));
    }).catch(() => {});
  }, []);

  const handleSubmit = async (data: DonationFormData, screenshotUrl?: string) => {
    await createDonation({
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
    router.push("/donations");
  };

  const handleOpenRazorpay = () => {
    window.open(RAZORPAY_PAYMENT_LINK, "_blank", "noopener,noreferrer");
    setRazorpayOpened(true);
    setShowSteps(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/donations">
          <Button variant="outline" size="icon" className="border-2 border-gray-300 hover:bg-gray-100 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="bg-gradient-to-br from-[#10B981] to-[#059669] p-2.5 sm:p-3 rounded-xl shadow-lg ring-4 ring-[#D1FAE5] shrink-0">
          <Save className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-gray-900">Add Donation</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-medium">Record a new donation</p>
        </div>
      </div>

      {/* ─── Razorpay Guided Flow Banner ─── */}
      <div className={`rounded-2xl border-2 overflow-hidden transition-all ${
        razorpayOpened
          ? "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50"
          : "border-[#0066FF]/30 bg-gradient-to-br from-[#E6F2FF] to-white"
      }`}>
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Razorpay Icon */}
            <div className={`shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-md ${
              razorpayOpened
                ? "bg-gradient-to-br from-green-500 to-emerald-600"
                : "bg-gradient-to-br from-[#0066FF] to-[#0052CC]"
            }`}>
              {razorpayOpened ? (
                <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              ) : (
                <span className="text-white font-extrabold text-lg">₹</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                  {razorpayOpened ? "Payment Done? Upload Screenshot Below ↓" : "Pay via Razorpay"}
                </h3>
                {!razorpayOpened && (
                  <span className="text-[10px] font-bold text-[#0066FF] bg-[#0066FF]/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                {razorpayOpened
                  ? "Fill in the donor details and upload the payment screenshot to record the donation."
                  : "Open the Razorpay payment page, complete the payment, then come back to upload the screenshot."
                }
              </p>

              {/* Action */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {!razorpayOpened ? (
                  <Button
                    type="button"
                    onClick={handleOpenRazorpay}
                    className="h-10 px-4 sm:px-5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold text-sm gap-2 shadow-md"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Razorpay to Pay
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full border border-green-200">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Razorpay page opened — upload screenshot below
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setShowSteps(!showSteps)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 font-medium transition-colors"
                >
                  {showSteps ? "Hide" : "Show"} steps
                  {showSteps ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Guide Steps */}
          {showSteps && (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { step: "1", label: "Pay via Razorpay", desc: "Open link & pay", done: razorpayOpened },
                { step: "2", label: "Take Screenshot", desc: "Save confirmation", done: false },
                { step: "3", label: "Fill & Submit", desc: "Upload & record", done: false },
              ].map((s) => (
                <div
                  key={s.step}
                  className={`rounded-xl p-2.5 sm:p-3 text-center border transition-all ${
                    s.done
                      ? "bg-green-100 border-green-300"
                      : "bg-white/60 border-gray-200"
                  }`}
                >
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mx-auto mb-1.5 text-xs sm:text-sm font-extrabold ${
                    s.done
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {s.done ? "✓" : s.step}
                  </div>
                  <p className="text-[10px] sm:text-xs font-bold text-gray-800">{s.label}</p>
                  <p className="text-[9px] sm:text-[10px] text-gray-400">{s.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notice for coordinators */}
      {!isPrivileged && (
        <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-300 rounded-xl px-4 sm:px-5 py-3 sm:py-4">
          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-bold text-amber-900">Your submission will be reviewed</p>
            <p className="text-amber-800 mt-0.5">
              Donations you submit go to <span className="font-semibold">Admin / Treasurer</span> for
              verification before they appear in the donations list.
            </p>
          </div>
        </div>
      )}

      <Card className="border-2 border-gray-200 shadow-lg">
        <CardHeader className="border-b-2 border-gray-200 bg-gradient-to-r from-[#D1FAE5] to-white">
          <CardTitle className="text-gray-900 font-bold flex items-center gap-2 text-sm sm:text-base">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Save className="h-4 w-4 sm:h-5 sm:w-5 text-[#10B981]" />
            </div>
            Donation Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          <DonationForm
            onSubmit={handleSubmit}
            onCancel={() => router.push("/donations")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
