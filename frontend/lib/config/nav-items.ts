import {
  LayoutDashboard,
  Car,
  Wallet,
  Building2,
  Users,
  Receipt,
  ShieldAlert,
  BarChart3,
  MessageSquare,
  UserCog,
  Radio,
  Bell,
  type LucideIcon,
} from "lucide-react";

// ─────────────────────────────────────────────────────
//  nav-items.ts
//  Defines sidebar menu items per role in ONE place.
//  Sidebar component just reads from here — adding
//  a new menu item later means editing only this file.
// ─────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItemsByRole: Record<"admin" | "operator" | "user", NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Users", href: "/dashboard/admin/users", icon: Users },
    { label: "Vehicles", href: "/dashboard/admin/vehicles", icon: Car },
    { label: "Accounts", href: "/dashboard/admin/accounts", icon: Wallet },
    { label: "Booths", href: "/dashboard/admin/booths", icon: Building2 },
    { label: "Operators", href: "/dashboard/admin/operators", icon: UserCog },
    { label: "Transactions", href: "/dashboard/admin/transactions", icon: Receipt },
    { label: "Blacklist", href: "/dashboard/admin/blacklist", icon: ShieldAlert },
    { label: "Reports", href: "/dashboard/admin/reports", icon: BarChart3 },
    { label: "Messages", href: "/dashboard/admin/messages", icon: MessageSquare },
    { label: "Notifications", href: "/dashboard/admin/notifications", icon: Bell },
  ],
  operator: [
    { label: "Dashboard", href: "/dashboard/operator", icon: LayoutDashboard },
    { label: "My Booth", href: "/dashboard/operator/booth", icon: Building2 },
    { label: "Process Toll", href: "/dashboard/operator/process-toll", icon: Radio },
    { label: "Transactions", href: "/dashboard/operator/transactions", icon: Receipt },
    { label: "Messages", href: "/dashboard/operator/messages", icon: MessageSquare },
    { label: "Notifications", href: "/dashboard/operator/notifications", icon: Bell },
  ],
  user: [
    { label: "Dashboard", href: "/dashboard/user", icon: LayoutDashboard },
    { label: "My Vehicles", href: "/dashboard/user/vehicles", icon: Car },
    { label: "My Account", href: "/dashboard/user/account", icon: Wallet },
    { label: "Transactions", href: "/dashboard/user/transactions", icon: Receipt },
    { label: "Messages", href: "/dashboard/user/messages", icon: MessageSquare },
    { label: "Notifications", href: "/dashboard/user/notifications", icon: Bell },
  ],
};