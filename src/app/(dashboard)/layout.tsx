import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar - Fixed */}
      <Sidebar />

      {/* Main Content Area - Pushed to right of sidebar */}
      <div className="md:ml-72">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="min-h-screen overflow-y-auto bg-gray-50 pb-20 md:pb-8">
          <div className="mx-auto px-4 py-6 sm:px-6 md:px-8 max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
