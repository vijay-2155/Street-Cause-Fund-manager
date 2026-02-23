"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Receipt,
  FileText,
  Settings,
  CheckCircle,
  Heart,
  Sparkles,
  BookOpen,
  Droplet,
} from "lucide-react";
import Image from "next/image";
import { getClubSettings } from "@/app/actions/settings";
import { getPendingCount } from "@/app/actions/approvals";
import { getCurrentUserRole } from "@/app/actions/donations";

type NavItem = {
  name: string;
  href: string;
  icon: any;
  color: string;
  /** Roles that can see this item. Omit = visible to all. */
  allowedRoles?: string[];
};

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "#0066FF" },
  { name: "Team", href: "/team", icon: Users, color: "#06B6D4", allowedRoles: ["admin", "treasurer"] },
  { name: "Events", href: "/events", icon: Calendar, color: "#8B5CF6" },
  { name: "Donations", href: "/donations", icon: Heart, color: "#00D084" },
  { name: "Expenses", href: "/expenses", icon: Receipt, color: "#FF6B35" },
  { name: "Approvals", href: "/approvals", icon: CheckCircle, color: "#00D084", allowedRoles: ["admin", "treasurer"] },
  { name: "Reports", href: "/reports", icon: FileText, color: "#8B5CF6", allowedRoles: ["admin", "treasurer"] },
  { name: "Blog", href: "/posts", icon: BookOpen, color: "#10B981" },
  { name: "Blood Donors", href: "/blood-donors", icon: Droplet, color: "#EF4444" },
  { name: "Settings", href: "/settings", icon: Settings, color: "#6B7280", allowedRoles: ["admin"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const [clubName, setClubName] = useState("Street Cause");
  const [clubLogo, setClubLogo] = useState("/icons/logo.png");
  const [pendingCount, setPendingCount] = useState(0);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        const club = await getClubSettings();
        if (club.name) setClubName(club.name);
        if (club.logoUrl) setClubLogo(club.logoUrl);
      } catch (error) {
        console.error("Error fetching club settings:", error);
      }
    };

    const fetchPendingCount = async () => {
      try {
        const count = await getPendingCount();
        setPendingCount(count);
      } catch {
        // Non-privileged users get 0 silently
      }
    };

    const fetchRole = async () => {
      try {
        const role = await getCurrentUserRole();
        setUserRole(role);
      } catch {}
    };

    fetchClubData();
    fetchPendingCount();
    fetchRole();
  }, []);

  // Filter nav items based on role
  const visibleNav = navigation.filter((item) => {
    if (!item.allowedRoles) return true; // visible to all
    if (!userRole) return false; // hide until role loaded
    if (userRole === "admin") return true; // admin sees everything
    return item.allowedRoles.includes(userRole);
  });

  return (
    <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 shadow-xl">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Modern Logo Header */}
        <div className="flex flex-col gap-4 p-6 bg-white border-b border-gray-100">
          <div className="flex items-center gap-4">
            {/* Large Visible Logo */}
            <div className="relative">
              <div className="w-14 h-14 bg-[#0066FF] rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-[#E6F2FF]">
                <Image
                  src={clubLogo}
                  alt={`${clubName} Logo`}
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#10B981] rounded-full border-2 border-white flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Brand Text */}
            <div className="flex-1">
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                {clubName}
              </h1>
              <p className="text-xs font-semibold text-gray-500 tracking-wide uppercase">
                Fund Manager
              </p>
            </div>
          </div>

          {/* Quick Stats Badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#D1FAE5] rounded-lg border border-[#10B981]">
            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
            <span className="text-xs font-bold text-[#10B981]">All Systems Active</span>
          </div>
        </div>

        {/* Modern Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Navigation
          </p>
          {visibleNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-[#0066FF] text-white shadow-lg shadow-[#0066FF]/30 scale-[1.02]"
                    : "text-gray-600 hover:bg-white hover:shadow-md hover:scale-[1.01]"
                )}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                )}

                {/* Icon with Color */}
                <div className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-lg transition-all",
                  isActive
                    ? "bg-white/20"
                    : "bg-gray-100 group-hover:bg-gray-200"
                )}>
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-all",
                      isActive
                        ? "text-white"
                        : "text-gray-500 group-hover:text-[#0066FF]"
                    )}
                    style={!isActive ? { color: 'inherit' } : {}}
                  />
                </div>

                {/* Label */}
                <span className="flex-1">{item.name}</span>

                {/* Pending badge for Approvals */}
                {item.href === "/approvals" && pendingCount > 0 && (
                  <span className={`text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center ${
                    isActive ? "bg-white/30 text-white" : "bg-red-500 text-white"
                  }`}>
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}

                {/* Hover Arrow */}
                {!isActive && item.href !== "/approvals" && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Modern Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 text-center font-medium">
            © 2026 {clubName} · v2.0
          </p>
        </div>
      </div>
    </aside>
  );
}
