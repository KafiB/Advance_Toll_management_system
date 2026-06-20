"use client";

import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { messagesApi } from "@/lib/api/messages";
import { useAuthStore } from "@/lib/store/auth-store";
import Link from "next/link";

// ─────────────────────────────────────────────────────
//  topbar.tsx
//  Fixed header — breadcrumbs + notification bell
//  (with real unread count) + theme toggle + profile
// ─────────────────────────────────────────────────────

export function Topbar() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role ?? "user";

  const { data } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => messagesApi.getUnreadCount(),
    refetchInterval: 30000, // refresh every 30s
  });

  const unreadCount = data?.data?.unreadCount ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Breadcrumbs />

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href={`/dashboard/${role}/notifications`}>
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Link>
        </Button>

        <ProfileMenu />
      </div>
    </header>
  );
}