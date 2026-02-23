"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const errorDesc = params.get("error_description");
      const errorCode = params.get("error");
      if (errorDesc) {
        const message = decodeURIComponent(errorDesc.replace(/\+/g, " "));
        setAuthError(message);
        toast.error(message);
      } else if (errorCode) {
        setAuthError(errorCode);
        toast.error(errorCode);
      }
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: "offline", prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setOtpSent(true);
      toast.success("Magic link sent");
    } catch (error: any) {
      toast.error(error.message || "Failed to send login email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      {/* ─── Left Panel (Brand 40%) ─── */}
      <div className="hidden lg:flex flex-col justify-between lg:w-[40%] p-12 xl:p-16 relative overflow-hidden bg-[#0066FF]">
        {/* Full Panel Background Image */}
        <Image
          src="/icons/vision.png"
          alt="Vision 2030"
          fill
          className="object-cover opacity-20"
          priority
        />
        {/* Vibrant Blue Solid Background */}
        <div className="absolute inset-0 bg-[#0066FF]" />

        {/* Logo */}
        <div className="relative z-10 w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-xl mb-8">
            <Image src="/icons/logo.png" alt="Logo" width={64} height={64} className="object-contain" />
        </div>

        {/* Typography Content */}
        <div className="relative z-10">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] mb-8 tracking-tight">
            Impact Starts <br/> With Transparency.
          </h1>

          <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
            <ShieldCheck className="w-5 h-5 text-white" />
            <span>Bank-Grade Security & Encryption</span>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-white/70 text-xs">
          © 2026 Street Cause Fund Manager
        </div>
      </div>

      {/* ─── Right Panel (Form 60%) ─── */}
      <div className="flex-1 flex flex-col justify-center bg-white px-6 sm:px-12 lg:px-24 xl:px-32 relative">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
             <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center">
                <Image src="/icons/logo.png" alt="Logo" width={24} height={24} className="object-contain" />
             </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Sign in</h2>
            <p className="mt-1 text-gray-600 text-sm">
               Welcome back. Please enter your details.
            </p>
          </div>

          <div className="space-y-5">
            {/* Google OAuth Button */}
            <Button
              variant="outline"
              className="w-full h-11 text-sm font-medium bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-[#0066FF] hover:text-gray-900 transition-all flex items-center justify-center gap-3 rounded-lg shadow-none"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <div className="w-4 h-4 relative flex-shrink-0">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
              </div>
              <span>Continue with Google</span>
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-500 font-medium">or continue with email</span>
              </div>
            </div>

            {/* Email Form */}
            {!otpSent ? (
              <form onSubmit={handleEmailLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    autoFocus
                    placeholder="name@streetcause.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-11 block w-full rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#0066FF] focus:ring-2 focus:ring-[#E6F2FF] transition-all font-normal px-3 shadow-none"
                  />
                </div>

                {authError && (
                  <Alert variant="destructive" className="rounded-lg border-2 border-[#EF4444] bg-[#FEF2F2] text-[#EF4444] shadow-none">
                    <AlertDescription className="text-sm font-medium">{authError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-none text-sm font-semibold text-white bg-[#0066FF] hover:bg-[#0052CC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0066FF] transition-all"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            ) : (
                <div className="text-left bg-[#E6F2FF] border-2 border-[#0066FF] rounded-lg p-6">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-4 text-[#0066FF]">
                        <Mail className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">Check your inbox</h3>
                    <p className="mt-1 text-sm text-gray-600 mb-4">
                        We sent a magic link to <span className="font-semibold text-gray-900">{email}</span>
                    </p>
                    <button
                        onClick={() => { setOtpSent(false); setEmail(""); }}
                        className="text-xs font-semibold text-[#0066FF] hover:text-[#0052CC] underline underline-offset-2"
                    >
                        Try different email
                    </button>
                </div>
            )}
          </div>
          
          <div className="mt-8 text-xs text-gray-500 font-medium">
            🔒 Secure Encrypted Connection
          </div>
        </div>
      </div>
    </div>
  );
}
