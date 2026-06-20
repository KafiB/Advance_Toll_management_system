"use client";

import { useState } from "react";
import {
  TrendingUp,
  Building2,
  Car,
  Clock,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  useRevenueReport,
  useBoothPerformance,
  useDashboardSummary,
} from "@/lib/hooks/use-reports";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api/reports";

// ─────────────────────────────────────────────────────
//  admin/reports/page.tsx
//  Full analytics dashboard — revenue trends,
//  booth performance, vehicle type breakdown,
//  and traffic patterns by hour.
// ─────────────────────────────────────────────────────

const COLORS = [
  "var(--primary)",
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

export default function AdminReportsPage() {
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  const { data: summaryRes, isLoading: summaryLoading } = useDashboardSummary();
  const { data: revenueRes, isLoading: revenueLoading } = useRevenueReport(groupBy);
  const { data: boothRes, isLoading: boothLoading } = useBoothPerformance();

  const { data: vehicleTypeRes, isLoading: vehicleTypeLoading } = useQuery({
    queryKey: ["reports", "vehicle-types"],
    queryFn: () => reportsApi.getBoothPerformance(),
  });

  const { data: trafficRes, isLoading: trafficLoading } = useQuery({
    queryKey: ["reports", "traffic-patterns"],
    queryFn: async () => {
      const { data } = await import("@/lib/api/axios").then((m) => m.default.get("/reports/traffic-patterns"));
      return data;
    },
  });

  const summary = summaryRes?.data;
  const revenueData = (revenueRes?.data?.data ?? []).map((p) => ({
    ...p,
    label: new Date(p.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  const boothData = boothRes?.data?.booths ?? [];
  const trafficData = (trafficRes?.data as { hourlyData?: { hour: number; transactions: number; revenue: number }[] })?.hourlyData ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-heading tracking-tight">
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          System-wide performance insights
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Today Revenue</p>
                <p className="text-2xl font-semibold mt-1">
                  {formatCurrency(summary?.today.revenue ?? 0)} BDT
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary?.today.count ?? 0} transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-semibold mt-1">
                  {formatCurrency(summary?.thisMonth.revenue ?? 0)} BDT
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary?.thisMonth.count ?? 0} transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">All-Time Revenue</p>
                <p className="text-2xl font-semibold mt-1">
                  {formatCurrency(summary?.allTime.revenue ?? 0)} BDT
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Active Booths</p>
                <p className="text-2xl font-semibold mt-1">
                  {summary?.overview.activeBooths ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary?.overview.totalVehicles ?? 0} vehicles registered
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts tabs */}
      <Tabs defaultValue="revenue">
        <TabsList className="mb-4">
          <TabsTrigger value="revenue" className="gap-1">
            <TrendingUp className="h-4 w-4" strokeWidth={1.75} />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="booths" className="gap-1">
            <Building2 className="h-4 w-4" strokeWidth={1.75} />
            Booths
          </TabsTrigger>
          <TabsTrigger value="traffic" className="gap-1">
            <Clock className="h-4 w-4" strokeWidth={1.75} />
            Traffic
          </TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Toll revenue over time</CardDescription>
              </div>
              <Select
                value={groupBy}
                onValueChange={(v) => setGroupBy(v as "day" | "week" | "month")}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <Skeleton className="h-[300px] rounded-lg" />
              ) : revenueData.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                  No revenue data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: number) => [`${formatCurrency(v)} BDT`, "Revenue"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booths Tab */}
        <TabsContent value="booths">
          <Card>
            <CardHeader>
              <CardTitle>Booth Performance</CardTitle>
              <CardDescription>Revenue comparison across booths</CardDescription>
            </CardHeader>
            <CardContent>
              {boothLoading ? (
                <Skeleton className="h-[300px] rounded-lg" />
              ) : boothData.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                  No booth data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={boothData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="boothCode" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: number) => [`${formatCurrency(v)} BDT`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Traffic Tab */}
        <TabsContent value="traffic">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Patterns</CardTitle>
              <CardDescription>Transaction volume by hour of day</CardDescription>
            </CardHeader>
            <CardContent>
              {trafficLoading ? (
                <Skeleton className="h-[300px] rounded-lg" />
              ) : trafficData.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                  No traffic data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="hour"
                      tickFormatter={(h) => `${h}:00`}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                      labelFormatter={(h) => `${h}:00`}
                      formatter={(v: number) => [v, "Transactions"]}
                    />
                    <Bar dataKey="transactions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}