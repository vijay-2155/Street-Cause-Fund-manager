"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bell, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setAvatarUrl(user.user_metadata?.avatar_url || null);
        setFullName(user.user_metadata?.full_name || user.email || "");
      }
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <header
      className="sticky top-0 z-10 flex items-center gap-4 border-b border-gray-200 bg-white/80 backdrop-blur-md px-4 sm:px-6 md:px-8 shadow-sm"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))", height: "calc(4rem + env(safe-area-inset-top, 0px))" }}
    >
      <div className="flex-1">
        <p className="text-sm text-gray-600 font-medium">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative hover:bg-[#E6F2FF]">
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#FF6B35] animate-pulse" />
        </Button>

        {/* User Avatar + Sign Out */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full ring-2 ring-[#0066FF] ring-offset-1 focus:outline-none">
              <Avatar className="h-9 w-9">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-[#0066FF] text-white text-sm font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
            </div>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-600 focus:text-red-600 cursor-pointer gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
