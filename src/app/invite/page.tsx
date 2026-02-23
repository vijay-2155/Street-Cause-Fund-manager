import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, Shield, UserCog, UserCheck, ArrowRight, AlertCircle, Clock } from "lucide-react";
import { getPublicInvite } from "@/app/actions/team";

interface InvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

const roleConfig: Record<string, { label: string; description: string; color: string; bg: string; icon: React.ElementType }> = {
  admin: {
    label: "Admin",
    description: "Full access to all features, settings, and member management",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    icon: Shield,
  },
  treasurer: {
    label: "Treasurer",
    description: "Approve expenses, manage finances, and invite team members",
    color: "#0066FF",
    bg: "#EFF6FF",
    icon: UserCog,
  },
  coordinator: {
    label: "Coordinator",
    description: "Record donations, submit expenses, and manage events",
    color: "#10B981",
    bg: "#F0FDF4",
    icon: UserCheck,
  },
};

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const { token } = await searchParams;

  if (!token) redirect("/sign-in");

  const invite = await getPublicInvite(token);
  const role = invite ? (roleConfig[invite.role] ?? roleConfig.coordinator) : roleConfig.coordinator;
  const RoleIcon = role.icon;

  const daysLeft = invite?.expiresAt
    ? Math.ceil((new Date(invite.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">

        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 bg-[#0066FF] rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="font-extrabold text-gray-900 text-xl">Street Cause</span>
          </Link>
        </div>

        {!invite ? (
          /* ── Invalid / expired invite ─────────────────────────────────────── */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-[#FFF1F2] rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Invite not found</h1>
            <p className="text-sm text-gray-500">
              This invite link is invalid or has already expired. Please ask your admin to send a new invitation.
            </p>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0066FF] hover:underline"
            >
              Go to Sign in <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          /* ── Valid invite ─────────────────────────────────────────────────── */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            {/* Top banner */}
            <div className="bg-[#0066FF] px-6 py-5 text-white text-center">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                You've been invited to join
              </p>
              <h1 className="text-2xl font-extrabold">Street Cause</h1>
            </div>

            <div className="p-6 space-y-5">
              {/* Role card */}
              <div
                className="flex items-center gap-4 rounded-xl p-4 border"
                style={{ backgroundColor: role.bg, borderColor: role.color + "33" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: role.color + "22" }}
                >
                  <RoleIcon className="h-6 w-6" style={{ color: role.color }} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Your role</p>
                  <p className="font-extrabold text-gray-900 text-lg" style={{ color: role.color }}>
                    {role.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                </div>
              </div>

              {/* Invited email */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-200">
                <span className="text-gray-400 font-medium">Invite sent to: </span>
                <span className="font-bold">{invite.email}</span>
              </div>

              {/* Expiry */}
              {daysLeft !== null && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  Invite expires in <strong className="text-gray-700">{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 text-xs text-[#1D4ED8] space-y-1">
                <p className="font-bold">How to join:</p>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Click the button below to sign in with Google</li>
                  <li>Use the Google account matching <strong>{invite.email}</strong></li>
                  <li>{"You'll"} automatically get {role.label} access</li>
                </ol>
              </div>

              {/* CTA */}
              <Link
                href="/sign-in"
                className="flex items-center justify-center gap-2 w-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-md"
              >
                Accept Invite & Sign in with Google
                <ArrowRight className="h-4 w-4" />
              </Link>

              <p className="text-center text-xs text-gray-400">
                Make sure to sign in with <strong>{invite.email}</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
