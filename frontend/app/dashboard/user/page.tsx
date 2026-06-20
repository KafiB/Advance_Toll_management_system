"use client";

import Link from "next/link";
import {
  Wallet,
  Car,
  Receipt,
  Plus,
  ArrowRight,
  AlertTriangle,
  Gauge,
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
import { useMyAccount } from "@/lib/hooks/use-accounts";
import { useMyVehicles } from "@/lib/hooks/use-vehicles";
import { useMyTransactions } from "@/lib/hooks/use-transactions";
import { Transaction } from "@/lib/api/types";

// ─────────────────────────────────────────────────────
//  user/page.tsx
//  User dashboard home.
//
//  Shows wallet balance, vehicle count, and recent
//  transactions. If user has no account/wallet yet,
//  shows a "create account" prompt instead of a
//  balance of 0 — guides them through onboarding.
// ─────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value) + " BDT";

const typeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  toll: "default",
  topup: "secondary",
  refund: "outline",
  adjustment: "outline",
};

export default function UserDashboard() {
  const user = useAuthStore((state) => state.user);
  const { data: accountRes, isLoading: accountLoading, error: accountError } = useMyAccount();
  const { data: vehiclesRes, isLoading: vehiclesLoading } = useMyVehicles();
  const { data: txRes, isLoading: txLoading } = useMyTransactions({ limit: 5 });

  const account = accountRes?.data;
  const hasNoAccount = !!accountError; // 404 -> no account yet
  const vehicles = vehiclesRes?.data?.vehicles ?? [];
  const transactions = (txRes?.data ?? []) as Transaction[];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold font-heading tracking-tight">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your account
        </p>
      </div>

      {/* No account yet — onboarding prompt */}
      {!accountLoading && hasNoAccount && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <Wallet className="h-5 w-5 text-amber-600" strokeWidth={1.75} />
              </div>
              <div>
                <p className="font-medium">Create your wallet to get started</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  You need a wallet to pay tolls automatically when your vehicle passes through a booth.
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/dashboard/user/account">
                Create Wallet
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {accountLoading || vehiclesLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Wallet Balance"
              value={hasNoAccount ? "—" : formatCurrency(account?.balance ?? 0)}
              icon={Wallet}
              iconColor="bg-emerald-500/10 text-emerald-600"
              trend={
                account?.isLowBalance
                  ? { value: "Low balance — top up soon", positive: false }
                  : undefined
              }
            />
            <StatCard
              label="My Vehicles"
              value={vehicles.length}
              icon={Car}
              iconColor="bg-blue-500/10 text-blue-600"
            />
            <StatCard
              label="Total Toll Paid"
              value={hasNoAccount ? "—" : formatCurrency(account?.totalTollAmount ?? 0)}
              icon={Receipt}
              iconColor="bg-violet-500/10 text-violet-600"
            />
          </>
        )}
      </div>

      {/* Low balance warning */}
      {account?.isLowBalance && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" strokeWidth={1.75} />
            <p className="text-sm">
              Your balance ({formatCurrency(account.balance)}) is at or below your minimum
              threshold ({formatCurrency(account.minimumBalance)}).{" "}
              <Link href="/dashboard/user/account" className="font-medium underline">
                Top up now
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* My vehicles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Vehicles</CardTitle>
              <CardDescription>Vehicles registered to your account</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/user/vehicles">
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                Add
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {vehiclesLoading ? (
              <Skeleton className="h-[150px] rounded-lg" />
            ) : vehicles.length === 0 ? (
              <div className="flex h-[150px] flex-col items-center justify-center gap-2 text-center">
                <Car className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-sm text-muted-foreground">No vehicles registered yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.slice(0, 4).map((vehicle) => (
                  <Link
                    key={vehicle._id}
                    href={`/dashboard/user/vehicles/${vehicle._id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Car className="h-4 w-4 text-primary" strokeWidth={1.75} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{vehicle.licensePlate}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.make} {vehicle.model} • {vehicle.year}
                        </p>
                      </div>
                    </div>
                    {vehicle.isBlacklisted ? (
                      <Badge variant="destructive">Blacklisted</Badge>
                    ) : (
                      <Badge variant="outline" className="capitalize">
                        {vehicle.vehicleType}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest toll activity</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/user/transactions">
                View all
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <Skeleton className="h-[150px] rounded-lg" />
            ) : transactions.length === 0 ? (
              <div className="flex h-[150px] flex-col items-center justify-center gap-2 text-center">
                <Gauge className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-sm text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx._id}>
                      <TableCell>
                        <Badge variant={typeVariant[tx.type]} className="capitalize">
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={
                          tx.type === "topup" || tx.type === "refund"
                            ? "text-emerald-600"
                            : ""
                        }
                      >
                        {tx.type === "topup" || tx.type === "refund" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tx.status === "success" ? "default" : "destructive"}
                          className="capitalize"
                        >
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(tx.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}