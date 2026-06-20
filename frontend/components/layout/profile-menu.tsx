"use client";

import Link from "next/link";
import { User, LogOut, Settings, Loader2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { useAuthStore } from "@/lib/store/auth-store";
import { useLogout } from "@/lib/hooks/use-logout";

// ─────────────────────────────────────────────────────
//  profile-menu.tsx
//  Shows the logged-in user's avatar (initials) in
//  the topbar. Clicking opens a dropdown with profile
//  link, settings, and logout.
// ─────────────────────────────────────────────────────

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  operator: "secondary",
  user: "outline",
};

export function ProfileMenu() {
  const user = useAuthStore((state) => state.user);
  const { mutate: logout, isPending } = useLogout();

  const role = user?.role ?? "user";
  const profileHref = `/dashboard/${role}/profile`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full outline-none ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="font-medium">{user?.name}</span>
          <span className="text-xs text-muted-foreground truncate">
            {user?.email}
          </span>
          <Badge
            variant={roleBadgeVariant[role]}
            className="mt-1 w-fit capitalize text-xs"
          >
            {role}
          </Badge>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={profileHref} className="cursor-pointer">
            <User className="h-4 w-4" strokeWidth={1.75} />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={`/dashboard/${role}/settings`} className="cursor-pointer">
            <Settings className="h-4 w-4" strokeWidth={1.75} />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => logout()}
          disabled={isPending}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
          ) : (
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
          )}
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}