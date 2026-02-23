"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Heart,
  Receipt,
  Calendar,
  BookOpen,
  MoreHorizontal,
  CheckCircle,
  FileText,
  Settings,
  Users,
} from "lucide-react";
import { getCurrentUserRole } from "@/app/actions/donations";

type MobileNavItem = {
  name: string;
  href: string;
  icon: any;
  /** Roles that can see this item. Omit = visible to all. */
  allowedRoles?: string[];
};

const allNavItems: MobileNavItem[] = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Donations", href: "/donations", icon: Heart },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Blog", href: "/posts", icon: BookOpen },
  { name: "Team", href: "/team", icon: Users, allowedRoles: ["admin", "treasurer"] },
  { name: "Approvals", href: "/approvals", icon: CheckCircle, allowedRoles: ["admin", "treasurer"] },
  { name: "Reports", href: "/reports", icon: FileText, allowedRoles: ["admin", "treasurer"] },
  { name: "Settings", href: "/settings", icon: Settings, allowedRoles: ["admin"] },
];

export function MobileNav() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>("");
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    getCurrentUserRole()
      .then((role) => setUserRole(role))
      .catch(() => {});
  }, []);

  // Filter by role
  const visibleItems = allNavItems.filter((item) => {
    if (!item.allowedRoles) return true;
    if (!userRole) return false;
    if (userRole === "admin") return true;
    return item.allowedRoles.includes(userRole);
  });

  // Primary items (first 4) and overflow items
  const primaryItems = visibleItems.slice(0, 4);
  const overflowItems = visibleItems.slice(4);
  const hasOverflow = overflowItems.length > 0;

  // Check if active page is in overflow
  const isOverflowActive = overflowItems.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));

  return (
    <>
      {/* Overflow Panel */}
      {showMore && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowMore(false)}
          />
          <div className="md:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-2 right-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 animate-in slide-in-from-bottom-4 duration-200">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">More</p>
            <div className="grid grid-cols-4 gap-1">
              {overflowItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      "flex flex-col items-center justify-center py-3 rounded-xl transition-all gap-1",
                      isActive
                        ? "bg-[#0066FF] text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[10px] font-semibold">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-around h-16 px-1">
          {primaryItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all",
                  isActive
                    ? "text-[#0066FF]"
                    : "text-gray-400 active:text-gray-600"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "drop-shadow-sm")} />
                <span className="text-[10px] font-semibold">{item.name}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#0066FF] rounded-b-full" />
                )}
              </Link>
            );
          })}

          {/* More button */}
          {hasOverflow && (
            <button
              onClick={() => setShowMore(!showMore)}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all",
                showMore || isOverflowActive
                  ? "text-[#0066FF]"
                  : "text-gray-400 active:text-gray-600"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-semibold">More</span>
              {isOverflowActive && !showMore && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#0066FF] rounded-b-full" />
              )}
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
