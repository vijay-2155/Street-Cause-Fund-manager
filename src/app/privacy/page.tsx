import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — Street Cause",
  description: "Privacy Policy for Street Cause Fund Manager. Learn how we collect, use, and protect your personal information.",
};

const LAST_UPDATED = "February 23, 2026";
const ORG_NAME = "Street Cause";
const CONTACT_EMAIL = "contact@streetcause.in";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/icons/logo.png" alt="Street Cause" width={36} height={36} className="rounded-lg" />
            <span className="font-bold text-gray-900 text-sm tracking-tight hidden sm:block">Street Cause</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Page title */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
            <Shield className="w-7 h-7 text-[#0066FF]" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Privacy Policy</h1>
            <p className="text-sm text-gray-500 mt-1">Last updated: {LAST_UPDATED}</p>
          </div>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <p>
              This Privacy Policy describes how <strong>{ORG_NAME}</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses,
              and protects information when you use the Street Cause Fund Manager application
              (&quot;the App&quot;). By using the App, you agree to the practices described in this policy.
            </p>
          </section>

          <Section title="1. Information We Collect">
            <p>When you sign in using Google OAuth, we receive the following information from Google:</p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li><strong>Name</strong> — your full name as registered on your Google account</li>
              <li><strong>Email address</strong> — your Google account email</li>
              <li><strong>Profile picture</strong> — your Google account avatar URL</li>
              <li><strong>Google User ID</strong> — a unique identifier used to link your account</li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> request access to your Google Drive, Gmail, Contacts, Calendar, or
              any other Google services beyond basic profile information.
            </p>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>The information collected is used solely to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>Create and manage your member account within the {ORG_NAME} organization</li>
              <li>Authenticate you securely on return visits</li>
              <li>Display your name and avatar within the App</li>
              <li>Associate financial records (donations, expenses) with your member profile</li>
              <li>Send organization-related email notifications where applicable</li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> sell, rent, or share your personal information with third parties
              for marketing or advertising purposes.
            </p>
          </Section>

          <Section title="3. Data Storage and Security">
            <p>
              Your data is stored securely in a PostgreSQL database hosted on{" "}
              <strong>Supabase</strong>, which provides industry-standard encryption at rest and in
              transit (TLS/SSL). Access to the database is restricted to authorized application
              services only.
            </p>
            <p className="mt-3">
              Authentication is handled by <strong>Supabase Auth</strong>, which implements
              secure session management and does not store your Google password.
            </p>
          </Section>

          <Section title="4. Data Sharing">
            <p>We use the following third-party services that may process your data:</p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>
                <strong>Google OAuth 2.0</strong> — for authentication only. Governed by{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#0066FF] underline">
                  Google&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong>Supabase</strong> — database and authentication infrastructure. Governed by{" "}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#0066FF] underline">
                  Supabase&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong>Vercel</strong> — application hosting. Governed by{" "}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#0066FF] underline">
                  Vercel&apos;s Privacy Policy
                </a>.
              </li>
            </ul>
            <p className="mt-3">
              Your information is never shared beyond what is necessary to operate the App.
            </p>
          </Section>

          <Section title="5. Blood Donor Information">
            <p>
              If you choose to register as a blood donor through a donation form, you may optionally
              provide your blood group and consent to be contacted for blood emergencies. This
              information is:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>Stored only when you explicitly opt in via the &quot;Can contact for blood&quot; consent field</li>
              <li>Visible only to signed-in members of the {ORG_NAME} organization</li>
              <li>Never published publicly on the internet</li>
            </ul>
          </Section>

          <Section title="6. Data Retention">
            <p>
              Your account data is retained for as long as you are an active member of{" "}
              {ORG_NAME}. You may request deletion of your data at any time by contacting us
              at the email below. Upon request, we will remove your personal information within 30 days,
              subject to any legal retention obligations.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Revoke Google OAuth access at any time via your{" "}
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-[#0066FF] underline">
                  Google Account permissions
                </a>
              </li>
            </ul>
          </Section>

          <Section title="8. Children's Privacy">
            <p>
              The App is not intended for use by individuals under the age of 13. We do not
              knowingly collect personal information from children. If you believe a child has
              provided us with personal information, please contact us immediately.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this
              page with an updated &quot;Last updated&quot; date. Continued use of the App after changes
              constitutes acceptance of the revised policy.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <p>
              If you have questions or concerns about this Privacy Policy or how your data is
              handled, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="font-bold text-gray-900">{ORG_NAME}</p>
              <p className="text-gray-600 mt-1">
                Email:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#0066FF] underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </Section>

        </div>
      </main>

      <footer className="bg-gray-50 border-t border-gray-100 py-8 text-center mt-12">
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} {ORG_NAME}. All rights reserved.{" "}
          <Link href="/" className="text-[#0066FF] hover:underline">Home</Link>
        </p>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">{title}</h2>
      <div className="space-y-3 text-gray-700">{children}</div>
    </section>
  );
}