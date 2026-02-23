import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Street Cause Fund Manager",
  description: "Sign in to manage your club's funds",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      {children}
    </div>
  );
}
