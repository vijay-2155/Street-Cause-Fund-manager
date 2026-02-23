"use client";

import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

function GoogleSignInButton() {
  const handleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file",
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  };

  return (
    <button
      onClick={handleSignIn}
      className="flex w-full items-center justify-center gap-3 rounded-xl bg-white border-2 border-gray-200 px-6 py-3.5 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Continue with Google
    </button>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen bg-white selection:bg-[#0066FF]/20 selection:text-[#0066FF]">
      {/* ── Left panel — Modern Brand Hero ─────────────────── */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#0066FF] p-12 lg:flex xl:w-5/12">
        {/* Modern abstract atmospheric glow */}
        <div className="absolute -left-1/4 -top-1/4 h-[150%] w-[150%] rounded-full bg-gradient-to-br from-white/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-1/4 -right-1/4 h-3/4 w-3/4 rounded-full bg-gradient-to-tl from-[#10B981]/20 to-transparent blur-3xl pointer-events-none" />

        {/* Top bar — Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-xl shadow-black/10 ring-1 ring-white/20">
            <Image
              src="/icons/logo.png"
              alt="Street Cause logo"
              width={34}
              height={34}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-white drop-shadow-sm">
            Street Cause
          </span>
        </div>

        {/* Middle — Typography & Vision Card */}
        <div className="relative z-10 flex flex-col gap-10">
          <div>
            <h1 className="text-[3.5rem] font-extrabold tracking-tight text-white leading-[1.05]">
              Empower <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-green-100">
                your impact.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-blue-100/90 font-medium leading-relaxed">
              Manage donations seamlessly, track campaigns in real-time, and lay the foundation for a sustainable tomorrow.
            </p>
          </div>

          {/* Vision 2030 Glassmorphism Card */}
          <div className="group relative max-w-[320px] rounded-3xl border border-white/15 bg-white/5 p-4 shadow-2xl backdrop-blur-md transition-transform duration-500 hover:-translate-y-2">
            <div className="overflow-hidden rounded-2xl bg-white/90">
              <Image
                src="/icons/vision.png"
                alt="Vision 2030 Street Cause"
                width={400}
                height={400}
                className="h-auto w-full object-cover mix-blend-multiply opacity-95 transition-opacity duration-300 group-hover:opacity-100"
                priority
              />
            </div>
            {/* Soft decorative glow behind the card */}
            <div className="absolute -inset-1 -z-10 rounded-full bg-gradient-to-tr from-white/30 to-white/0 opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-60" />
          </div>
        </div>

        {/* Bottom — Footer info */}
        <div className="relative z-10 flex items-center gap-4 text-sm font-medium text-blue-200/70">
          <span>© {new Date().getFullYear()} Street Cause</span>
          <span className="h-1 w-1 rounded-full bg-blue-300/40" />
          <span>Fund Manager Hub</span>
        </div>
      </div>

      {/* ── Right panel — Clerk form ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#FDFDFD] px-6 py-12 sm:px-12">
        {/* Mobile Header (hidden on large displays) */}
        <div className="mb-10 flex flex-col items-center gap-5 lg:hidden">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-gray-900/5">
            <Image
              src="/icons/logo.png"
              alt="Street Cause logo"
              width={56}
              height={56}
              priority
              className="object-contain"
            />
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Sign in to your account</h2>
            <p className="mt-2 text-sm font-medium text-gray-500">Welcome back to the Fund Manager</p>
          </div>
        </div>

        {/* Vision image on mobile only, displayed elegantly */}
        <div className="mb-8 w-full max-w-[300px] lg:hidden">
          <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
             <Image
                src="/icons/vision.png"
                alt="Vision 2030 Street Cause"
                width={300}
                height={300}
                className="h-auto w-full object-contain"
              />
          </div>
        </div>

        {/* Google Sign In */}
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 ring-1 ring-gray-200/50 p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="mt-2 text-sm text-gray-500">Sign in to your Street Cause account</p>
            </div>
            <GoogleSignInButton />
            <p className="text-center text-xs text-gray-400">
              By signing in, you agree to our terms of service. Only invited members can access the dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
