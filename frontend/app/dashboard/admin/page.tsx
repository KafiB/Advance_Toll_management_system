"use client";

import {
  Users,
  Car,
  Building2,
  ShieldAlert,
  TrendingUp,
  Receipt,
  Wallet,
  CalendarDays,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { BoothPerformanceChart } from "@/components/dashboard/booth-performance-chart";
import { useDashboardSummary, useRevenueReport, useBoothPerformance } from "@/lib/hooks/use-reports";

// ─────────────────────────────────────────────────────
//  admin/page.tsx
//  Admin dashboard home — the "big picture" view.
//
//  Pulls live data from:
//  GET /api/v1/reports/dashboard
//  GET /api/v1/reports/revenue
//  GET /api/v1/reports/booth-performance
// ─────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value) + " BDT";

export default function AdminDashboard() {
  const { data: summaryRes, isLoading: summaryLoading } = useDashboardSummary();
  const { data: revenueRes, isLoading: revenueLoading } = useRevenueReport("day");
  const { data: boothRes, isLoading: boothLoading } = useBoothPerformance();

  const summary = summaryRes?.data;
  const revenue = revenueRes?.data;
  const booths = boothRes?.data;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold font-heading tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Overview of your toll management system
        </p>
      </div>

      {/* Revenue stat cards — today / week / month / all-time */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Today's Revenue"
              value={formatCurrency(summary?.today.revenue ?? 0)}
              icon={CalendarDays}
              trend={{ value: `${summary?.today.count ?? 0} transactions`, positive: true }}
            />
            <StatCard
              label="This Week"
              value={formatCurrency(summary?.thisWeek.revenue ?? 0)}
              icon={TrendingUp}
              trend={{ value: `${summary?.thisWeek.count ?? 0} transactions`, positive: true }}
              iconColor="bg-blue-500/10 text-blue-600"
            />
            <StatCard
              label="This Month"
              value={formatCurrency(summary?.thisMonth.revenue ?? 0)}
              icon={Wallet}
              trend={{ value: `${summary?.thisMonth.count ?? 0} transactions`, positive: true }}
              iconColor="bg-violet-500/10 text-violet-600"
            />
            <StatCard
              label="All-Time Revenue"
              value={formatCurrency(summary?.allTime.revenue ?? 0)}
              icon={Receipt}
              trend={{ value: `${summary?.allTime.count ?? 0} transactions`, positive: true }}
              iconColor="bg-amber-500/10 text-amber-600"
            />
          </>
        )}
      </div>

      {/* Overview stat cards — users, vehicles, booths, blacklist */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Total Users"
              value={summary?.overview.totalUsers ?? 0}
              icon={Users}
              iconColor="bg-blue-500/10 text-blue-600"
            />
            <StatCard
              label="Total Vehicles"
              value={summary?.overview.totalVehicles ?? 0}
              icon={Car}
              iconColor="bg-emerald-500/10 text-emerald-600"
            />
            <StatCard
              label="Active Booths"
              value={summary?.overview.activeBooths ?? 0}
              icon={Building2}
              iconColor="bg-violet-500/10 text-violet-600"
            />
            <StatCard
              label="Blacklisted Vehicles"
              value={summary?.overview.activeBlacklists ?? 0}
              icon={ShieldAlert}
              iconColor="bg-red-500/10 text-red-600"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {revenueLoading ? (
          <Skeleton className="h-[380px] rounded-xl" />
        ) : (
          <RevenueChart data={revenue?.data ?? []} />
        )}

        {boothLoading ? (
          <Skeleton className="h-[380px] rounded-xl" />
        ) : (
          <BoothPerformanceChart data={booths?.booths ?? []} />
        )}
      </div>
    </div>
  );
}