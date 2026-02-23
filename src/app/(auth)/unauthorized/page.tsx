"use client";

import Link from "next/link";
import { ShieldX, ArrowLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 text-center space-y-6">
        {/* Icon */}
        <div className="w-20 h-20 bg-[#FFF1F2] rounded-full flex items-center justify-center mx-auto">
          <ShieldX className="h-10 w-10 text-red-500" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Access Denied</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Your account is not registered in this system. Only invited members can access the Street Cause Fund Manager.
          </p>
        </div>

        {/* Info box */}
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 text-left space-y-2">
          <p className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wide">How to get access</p>
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-[#0066FF] shrink-0 mt-0.5" />
            <span>Ask an Admin or Treasurer to invite you from the Team Members page.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <span className="w-4 h-4 rounded-full bg-[#0066FF] text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">!</span>
            <span>Make sure you sign in with the <strong>same Google account</strong> the invitation was sent to.</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            Sign Out &amp; Try Again
          </button>
          <Link
            href="/sign-in"
            className="text-sm text-gray-500 hover:text-[#0066FF] transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
