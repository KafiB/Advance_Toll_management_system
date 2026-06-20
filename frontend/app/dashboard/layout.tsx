"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuthStore } from "@/lib/store/auth-store";
import { useUIStore } from "@/lib/store/ui-store";
import { cn } from "@/lib/utils";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

// ─────────────────────────────────────────────────────
//  dashboard/layout.tsx
//  Wraps ALL /dashboard/* pages.
//
//  Structure:
//  ┌─────────────┬──────────────────────────┐
//  │             │  Topbar (breadcrumbs etc) │
//  │  Sidebar    ├──────────────────────────┤
//  │  (fixed)    │                           │
//  │             │  Page content             │
//  │             │  {children}               │
//  └─────────────┴──────────────────────────┘
//
//  Sidebar is "fixed" positioned (from sidebar.tsx),
//  so we add left padding here that matches its
//  width — and animates when collapsed/expanded.
// ─────────────────────────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={1.75} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />

      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "pl-[72px]" : "pl-64"
        )}
      >
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}