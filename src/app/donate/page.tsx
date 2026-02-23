import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Heart, ExternalLink, ArrowLeft, ShieldCheck, Zap, LineChart } from "lucide-react";
import { RAZORPAY_PAYMENT_LINK } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Donate to Street Cause",
  description: "Make a secure donation to Street Cause via Razorpay. Every rupee helps us create lasting impact in communities across India.",
  openGraph: {
    title: "Donate to Street Cause",
    description: "Support our mission. Make a secure donation via Razorpay.",
  }
};

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Poppins', 'Inter', sans-serif" }}>
      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/icons/logo.png" alt="Street Cause" width={36} height={36} className="rounded-lg" />
            <span className="font-bold text-gray-900 text-sm tracking-tight">Street Cause</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0066FF] via-[#0052CC] to-[#003D99]" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

          <div className="relative px-6 py-12 sm:px-16 sm:py-24 text-center">
            {/* Icon */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-8 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-inner">
              <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              Support Our Cause
            </h1>
            <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Your contribution fuels our mission to bring sustainable change. Donate securely through Razorpay and help us create lasting impact in communities across India.
            </p>

            {/* Donate Button */}
            <a
              href={RAZORPAY_PAYMENT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-8 sm:px-12 py-4 sm:py-5 w-full sm:w-auto text-base sm:text-lg font-bold text-[#0066FF] bg-white rounded-2xl hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              Donate Now via Razorpay
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </a>

            {/* How it works steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-16 max-w-3xl mx-auto text-left sm:text-center text-white">
              <div className="flex sm:flex-col items-center sm:items-center gap-4 sm:gap-0">
                <div className="w-12 h-12 rounded-full bg-white/20 flex flex-shrink-0 items-center justify-center sm:mx-auto sm:mb-4 border border-white/10">
                  <span className="text-lg font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Click Donate</h3>
                  <p className="text-sm text-blue-200">Open the secure Razorpay payment gateway</p>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-center gap-4 sm:gap-0">
                <div className="w-12 h-12 rounded-full bg-white/20 flex flex-shrink-0 items-center justify-center sm:mx-auto sm:mb-4 border border-white/10">
                  <span className="text-lg font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Make Payment</h3>
                  <p className="text-sm text-blue-200">Use UPI, Credit Card, or Net Banking</p>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-center gap-4 sm:gap-0">
                <div className="w-12 h-12 rounded-full bg-white/20 flex flex-shrink-0 items-center justify-center sm:mx-auto sm:mb-4 border border-white/10">
                  <span className="text-lg font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Get Receipt</h3>
                  <p className="text-sm text-blue-200">Receive instant payment confirmation</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features / Trust */}
        <div className="grid sm:grid-cols-3 gap-8 mt-12 px-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">100% Secure</h3>
            <p className="text-sm text-gray-500">Payments are processed securely by Razorpay with bank-grade encryption.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Instant Impact</h3>
            <p className="text-sm text-gray-500">Your funds are routed directly to our verified NGO accounts.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
              <LineChart className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Fully Transparent</h3>
            <p className="text-sm text-gray-500">Track how your funds are utilized through our public blog and updates.</p>
          </div>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="bg-[#1A1A1A] py-8 text-center mt-12">
        <p className="text-[#6B7280] text-sm">
          © {new Date().getFullYear()} Street Cause. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
