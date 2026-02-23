"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, CheckCircle, Loader2, Heart, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";

export default function SetupPage() {
  const [form, setForm] = useState({ secret: "", fullName: "", email: "" });
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.secret || !form.fullName || !form.email) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Setup failed. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 text-center space-y-6">
            {/* Icon */}
            <div className="w-20 h-20 bg-[#D1FAE5] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-[#10B981]" />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">You&apos;re all set!</h1>
              <p className="text-gray-500 mt-2 text-sm">
                Admin account created for{" "}
                <strong className="text-gray-900">{form.email}</strong>. Check your inbox for an invite email or sign in directly with Google.
              </p>
            </div>

            {/* Steps */}
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 text-left space-y-3">
              <p className="text-xs font-bold text-[#059669] uppercase tracking-wide">Next steps</p>
              {[
                `Check ${form.email} for an invite email from Supabase (check spam too)`,
                "Click the link in the email — OR — click the button below to sign in with Google",
                "You'll land on the dashboard with full Admin access",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#10B981] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              ))}
            </div>

            <Link
              href="/sign-in"
              className="flex items-center justify-center gap-2 w-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md"
            >
              Sign in with Google
              <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="text-xs text-gray-400">
              This setup page is now inactive — it only works once.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Setup form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-[#0066FF] rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="font-extrabold text-gray-900 text-xl">Street Cause</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-[#0066FF] px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold">First-time Setup</h1>
                <p className="text-white/70 text-xs">Create the admin account</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Info */}
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 text-xs text-[#1D4ED8]">
              <strong>How it works:</strong> Creates your admin account and sends an invite email to your address. After setup, click the invite link or sign in directly with Google — your account will be linked automatically.
            </div>

            {/* Setup Secret */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Setup Secret <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  placeholder="Enter SETUP_SECRET from your .env.local"
                  value={form.secret}
                  onChange={(e) => setForm({ ...form, secret: e.target.value })}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Add <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px]">SETUP_SECRET=your-secret</code> to your <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px]">.env.local</code> file.
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Your full name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Google Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="your.email@gmail.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-400">
                Must match the Google account you'll sign in with.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating admin account...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Create Admin Account
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-[#0066FF] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
