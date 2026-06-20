"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/auth-store";
import { useUIStore } from "@/lib/store/ui-store";
import { navItemsByRole } from "@/lib/config/nav-items";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ─────────────────────────────────────────────────────
//  sidebar.tsx
//  Collapsible left navigation.
//
//  Toggle button sits in the top header bar of the
//  sidebar itself — clicking it shrinks the sidebar
//  to icon-only width, clicking again expands it back.
// ─────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const role = user?.role ?? "user";
  const navItems = navItemsByRole[role];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-all duration-300",
        sidebarCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Header — logo + collapse toggle */}
      <div className="flex h-16 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" strokeWidth={1.75} />
          </div>
          {!sidebarCollapsed && (
            <span className="font-heading text-base font-semibold tracking-tight truncate">
              Toll System
            </span>
          )}
        </div>

        {/* Toggle button — always visible */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleSidebar}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                sidebarCollapsed && "absolute -right-3 top-5 h-6 w-6 rounded-full border bg-card shadow-sm"
              )}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.75} />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== `/dashboard/${role}` && pathname.startsWith(item.href));

          const linkContent = (
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );

          if (sidebarCollapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.href}>{linkContent}</div>;
        })}
      </nav>
    </aside>
  );
}