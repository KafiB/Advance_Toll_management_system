"use client";

import Link from "next/link";
import {
  Building2,
  MapPin,
  Radio,
  TrendingUp,
  Receipt,
  Wrench,
  ArrowRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useAuthStore } from "@/lib/store/auth-store";
import { useBooths } from "@/lib/hooks/use-booths";
import { Booth, User } from "@/lib/api/types";

// ─────────────────────────────────────────────────────
//  operator/booth/page.tsx
//  Shows full details of the operator's assigned booth.
// ─────────────────────────────────────────────────────

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v) + " BDT";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  operational: "default",
  maintenance: "secondary",
  closed: "destructive",
};

export default function OperatorBoothPage() {
  const user = useAuthStore((state) => state.user);
  const { data: boothsRes, isLoading } = useBooths();

  const myBooth = (boothsRes?.data ?? []).find((booth: Booth) => {
    if (!booth.assignedOperator) return false;
    const op = booth.assignedOperator as User;
    return op._id === user?.id || op.id === user?.id;
  }) as Booth | undefined;

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[150px] rounded-xl" />
      </div>
    );
  }

  if (!myBooth) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold font-heading tracking-tight">My Booth</h1>
          <p className="text-muted-foreground mt-1">Your assigned toll booth</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-6 w-6 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-medium">No booth assigned</p>
              <p className="text-sm text-muted-foreground mt-1">
                Contact an administrator to get assigned to a toll booth.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-heading tracking-tight">My Booth</h1>
        <p className="text-muted-foreground mt-1">Your assigned toll booth details</p>
      </div>

      {/* Booth header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-7 w-7 text-primary" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold">{myBooth.name}</h2>
                <Badge variant={statusVariant[myBooth.status]} className="capitalize">
                  {myBooth.status}
                </Badge>
              </div>
              <p className="text-sm font-mono text-muted-foreground mt-0.5">
                {myBooth.boothCode}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                {myBooth.location.address}, {myBooth.location.city}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {myBooth.highwayName}
                {myBooth.highwayNumber && ` (${myBooth.highwayNumber})`}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Today Revenue</p>
              <p className="font-semibold mt-0.5 text-emerald-600">
                {formatCurrency(myBooth.todayRevenue)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Today Transactions</p>
              <p className="font-semibold mt-0.5">{myBooth.todayTransactions}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="font-semibold mt-0.5">{formatCurrency(myBooth.totalRevenue)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Active Lanes</p>
              <p className="font-semibold mt-0.5">
                {myBooth.activeLanes}/{myBooth.totalLanes}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild size="lg" className="h-14">
          <Link href="/dashboard/operator/process-toll">
            <Radio className="h-5 w-5" strokeWidth={1.75} />
            Process Toll
            <ArrowRight className="h-4 w-4 ml-auto" strokeWidth={1.75} />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-14">
          <Link href="/dashboard/operator/transactions">
            <Receipt className="h-5 w-5" strokeWidth={1.75} />
            View Transactions
            <ArrowRight className="h-4 w-4 ml-auto" strokeWidth={1.75} />
          </Link>
        </Button>
      </div>

      {/* Toll rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" strokeWidth={1.75} />
            Toll Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Object.entries(myBooth.tollRates).map(([type, rate]) => (
              <div key={type} className="flex flex-col items-center rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground capitalize">{type}</p>
                <p className="font-semibold mt-1">{rate} BDT</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Maintenance info */}
      {myBooth.status === "maintenance" && (
        <Card className="border-amber-200 dark:border-amber-900">
          <CardContent className="flex items-start gap-3 p-4">
            <Wrench className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" strokeWidth={1.75} />
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Booth Under Maintenance
              </p>
              {myBooth.maintenanceNotes && (
                <p className="text-sm text-muted-foreground mt-1">
                  {myBooth.maintenanceNotes}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}