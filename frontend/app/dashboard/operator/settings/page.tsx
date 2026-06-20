"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Moon,
  Sun,
  Monitor,
  Bell,
  Shield,
  RefreshCw,
  Loader2,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { useAuthStore } from "@/lib/store/auth-store";
import { useMyAccount } from "@/lib/hooks/use-accounts";
import { accountsApi } from "@/lib/api/accounts";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────
//  settings/page.tsx
//  Account preferences — theme, notifications,
//  auto-recharge (users only), security info.
// ─────────────────────────────────────────────────────

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const { data: accountRes } = useMyAccount();
  const account = accountRes?.data;
  const queryClient = useQueryClient();

  const [rechargeEnabled, setRechargeEnabled] = useState(
    account?.autoRecharge?.isEnabled ?? false
  );
  const [rechargeAmount, setRechargeAmount] = useState(
    String(account?.autoRecharge?.rechargeAmount ?? 500)
  );
  const [triggerAmount, setTriggerAmount] = useState(
    String(account?.autoRecharge?.triggerAmount ?? 200)
  );

  const { mutate: updateAutoRecharge, isPending: updatingRecharge } =
    useMutation({
      mutationFn: accountsApi.toggleAutoRecharge,
      onSuccess: () => {
        toast.success("Auto-recharge settings updated");
        queryClient.invalidateQueries({ queryKey: ["accounts", "my-account"] });
      },
      onError: (error: { message: string }) => {
        toast.error("Update failed", { description: error.message });
      },
    });

  const handleSaveAutoRecharge = () => {
    updateAutoRecharge({
      isEnabled: rechargeEnabled,
      rechargeAmount: Number(rechargeAmount),
      triggerAmount: Number(triggerAmount),
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold font-heading tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your preferences and account settings
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="h-4 w-4" strokeWidth={1.75} />
            Appearance
          </CardTitle>
          <CardDescription>
            Choose how the dashboard looks for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                  theme === t.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
                )}
              >
                <t.icon
                  className={cn(
                    "h-5 w-5",
                    theme === t.value
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                  strokeWidth={1.75}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    theme === t.value ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {t.label}
                </span>
                {theme === t.value && (
                  <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" strokeWidth={1.75} />
            Notifications
          </CardTitle>
          <CardDescription>
            Notification preferences are managed automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              label: "New Messages",
              description: "Get notified when you receive a message",
              enabled: true,
            },
            {
              label: "Transaction Alerts",
              description: "Notifications for toll deductions and top-ups",
              enabled: true,
            },
            {
              label: "Low Balance Alert",
              description: "Alert when wallet balance is low",
              enabled: true,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2"
            >
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.description}
                </p>
              </div>
              <Badge variant={item.enabled ? "default" : "secondary"}>
                {item.enabled ? "On" : "Off"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Auto-recharge — users only */}
      {user?.role === "user" && account && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
              Auto-Recharge
            </CardTitle>
            <CardDescription>
              Automatically top up your wallet when balance is low
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enable/disable toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable Auto-Recharge</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automatically top up when balance falls below threshold
                </p>
              </div>
              <button
                onClick={() => setRechargeEnabled(!rechargeEnabled)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  rechargeEnabled ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                    rechargeEnabled ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {rechargeEnabled && (
              <>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="triggerAmount">
                      Trigger Amount (BDT)
                    </Label>
                    <Input
                      id="triggerAmount"
                      type="number"
                      value={triggerAmount}
                      onChange={(e) => setTriggerAmount(e.target.value)}
                      placeholder="200"
                    />
                    <p className="text-xs text-muted-foreground">
                      Top up when balance falls below this
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rechargeAmount">
                      Recharge Amount (BDT)
                    </Label>
                    <Input
                      id="rechargeAmount"
                      type="number"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      placeholder="500"
                    />
                    <p className="text-xs text-muted-foreground">
                      Amount to add automatically
                    </p>
                  </div>
                </div>
              </>
            )}

            <Button
              onClick={handleSaveAutoRecharge}
              disabled={updatingRecharge}
            >
              {updatingRecharge ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    strokeWidth={1.75}
                  />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" strokeWidth={1.75} />
            Security
          </CardTitle>
          <CardDescription>
            Your account security information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="text-sm font-medium">Email Verification</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user?.email}
              </p>
            </div>
            {user?.isEmailVerified ? (
              <Badge
                variant="outline"
                className="text-emerald-600 border-emerald-300 gap-1"
              >
                <Check className="h-3 w-3" strokeWidth={2} />
                Verified
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-amber-600 border-amber-300"
              >
                Unverified
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="text-sm font-medium">Account Role</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your access level in the system
              </p>
            </div>
            <Badge variant="secondary" className="capitalize">
              {user?.role}
            </Badge>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Password</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Change your password from the profile page
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={`/dashboard/${user?.role}/profile`}>
                Change Password
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b">
            <span className="text-muted-foreground">Full Name</span>
            <span className="font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b">
            <span className="text-muted-foreground">Phone</span>
            <span className="font-medium">{user?.phone ?? "—"}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-muted-foreground">Member Since</span>
            <span className="font-medium">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}