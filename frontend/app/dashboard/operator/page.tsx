"use client";

import Link from "next/link";
import {
  Building2,
  Receipt,
  TrendingUp,
  Radio,
  ArrowRight,
  MapPin,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { StatCard } from "@/components/dashboard/stat-card";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBooths } from "@/lib/hooks/use-booths";
import { useBoothTransactions } from "@/lib/hooks/use-transactions";
import { Booth, Transaction } from "@/lib/api/types";

// ─────────────────────────────────────────────────────
//  operator/page.tsx
//  Operator dashboard home.
//
//  Shows the booth this operator is assigned to,
//  today's stats for that booth, and recent
//  transactions processed there.
//
//  We find "my booth" by fetching all booths and
//  filtering client-side for assignedOperator == me.
//  (Backend has no dedicated "my-booth" route yet.)
// ─────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value) + " BDT";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  operational: "default",
  maintenance: "secondary",
  closed: "destructive",
};

export default function OperatorDashboard() {
  const user = useAuthStore((state) => state.user);
  const { data: boothsRes, isLoading: boothsLoading } = useBooths();

  const myBooth = boothsRes?.data?.find(
    (booth: Booth) =>
      typeof booth.assignedOperator === "object" &&
      booth.assignedOperator?.id === user?.id
  );

  const { data: txRes, isLoading: txLoading } = useBoothTransactions(
    myBooth?._id,
    { limit: 5 }
  );

  const recentTransactions = (txRes?.data ?? []) as Transaction[];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold font-heading tracking-tight">
          Operator Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.name}
        </p>
      </div>

      {boothsLoading ? (
        <Skeleton className="h-[120px] rounded-xl" />
      ) : !myBooth ? (
        // No booth assigned yet
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-6 w-6 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-medium">No booth assigned yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Contact an administrator to get assigned to a toll booth.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* My booth info card */}
          <Card>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-lg">{myBooth.name}</h2>
                    <Badge variant={statusVariant[myBooth.status]} className="capitalize">
                      {myBooth.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {myBooth.location.address}, {myBooth.location.city}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Booth Code: {myBooth.boothCode} • {myBooth.highwayName}
                  </p>
                </div>
              </div>

              <Button asChild>
                <Link href="/dashboard/operator/process-toll">
                  <Radio className="h-4 w-4" strokeWidth={1.75} />
                  Process Toll
                  <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Today's Revenue"
              value={formatCurrency(myBooth.todayRevenue)}
              icon={TrendingUp}
              iconColor="bg-emerald-500/10 text-emerald-600"
            />
            <StatCard
              label="Today's Transactions"
              value={myBooth.todayTransactions}
              icon={Receipt}
              iconColor="bg-blue-500/10 text-blue-600"
            />
            <StatCard
              label="Active Lanes"
              value={`${myBooth.activeLanes} / ${myBooth.totalLanes}`}
              icon={Building2}
              iconColor="bg-violet-500/10 text-violet-600"
            />
          </div>

          {/* Recent transactions table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest toll transactions at this booth</CardDescription>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <Skeleton className="h-[200px] rounded-lg" />
              ) : recentTransactions.length === 0 ? (
                <div className="flex h-[150px] items-center justify-center text-sm text-muted-foreground">
                  No transactions yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((tx) => (
                      <TableRow key={tx._id}>
                        <TableCell className="font-mono text-xs">
                          {tx.transactionRef}
                        </TableCell>
                        <TableCell>{tx.tollDetails?.licensePlate ?? "—"}</TableCell>
                        <TableCell className="capitalize">
                          {tx.tollDetails?.vehicleType ?? "—"}
                        </TableCell>
                        <TableCell>{formatCurrency(tx.amount)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={tx.status === "success" ? "default" : "destructive"}
                            className="capitalize"
                          >
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(tx.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}