"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  TrendingDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useMyAccount, useCreateAccount, useTopUp } from "@/lib/hooks/use-accounts";

// ─────────────────────────────────────────────────────
//  user/account/page.tsx
//  Shows wallet balance, stats, and provides
//  top-up functionality. If no account exists,
//  shows account creation form first.
// ─────────────────────────────────────────────────────

const createAccountSchema = z.object({
  initialDeposit: z.coerce.number()
    .min(100, "Minimum initial deposit is 100 BDT")
    .max(50000, "Maximum deposit is 50,000 BDT"),
  minimumBalance: z.coerce.number()
    .min(0, "Cannot be negative")
    .default(200),
});

const topUpSchema = z.object({
  amount: z.coerce.number()
    .min(100, "Minimum top-up amount is 100 BDT")
    .max(50000, "Maximum top-up amount is 50,000 BDT"),
  paymentMethod: z.string().optional(),
  paymentReference: z.string().optional(),
});

type CreateAccountValues = z.infer<typeof createAccountSchema>;
type TopUpValues = z.infer<typeof topUpSchema>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value) + " BDT";

export default function MyAccountPage() {
  const [topUpOpen, setTopUpOpen] = useState(false);
  const { data: accountRes, isLoading, error } = useMyAccount();
  const { mutate: createAccount, isPending: creating } = useCreateAccount();
  const { mutate: topUp, isPending: toppingUp } = useTopUp();

  const account = accountRes?.data;
  const hasNoAccount = !!error;

  const createForm = useForm<CreateAccountValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: { initialDeposit: 500, minimumBalance: 200 },
  });

  const topUpForm = useForm<TopUpValues>({
    resolver: zodResolver(topUpSchema),
    defaultValues: { amount: 500 },
  });

  const onCreateAccount = (values: CreateAccountValues) => {
    createAccount(values);
  };

  const onTopUp = (values: TopUpValues) => {
    topUp(values, {
      onSuccess: () => {
        setTopUpOpen(false);
        topUpForm.reset();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[150px] rounded-xl" />
      </div>
    );
  }

  // No account — show creation form
  if (hasNoAccount) {
    return (
      <div className="max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold font-heading tracking-tight">
            Create Your Wallet
          </h1>
          <p className="text-muted-foreground mt-1">
            Set up your toll wallet to pay automatically at booths
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4" strokeWidth={1.75} />
              Wallet Setup
            </CardTitle>
            <CardDescription>
              Minimum initial deposit is 100 BDT
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={createForm.handleSubmit(onCreateAccount)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="initialDeposit">Initial Deposit (BDT) *</Label>
                <Input
                  id="initialDeposit"
                  type="number"
                  placeholder="500"
                  {...createForm.register("initialDeposit")}
                />
                {createForm.formState.errors.initialDeposit && (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.initialDeposit.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumBalance">
                  Low Balance Alert Threshold (BDT)
                </Label>
                <Input
                  id="minimumBalance"
                  type="number"
                  placeholder="200"
                  {...createForm.register("minimumBalance")}
                />
                <p className="text-xs text-muted-foreground">
                  You will be notified when balance falls below this amount
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                    Creating wallet...
                  </>
                ) : (
                  "Create Wallet"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Has account — show balance and stats
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-heading tracking-tight">
            My Account
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            {account?.accountNumber}
          </p>
        </div>

        {/* Top-up dialog */}
        <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              Top Up
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Balance</DialogTitle>
              <DialogDescription>
                Current balance: {formatCurrency(account?.balance ?? 0)}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={topUpForm.handleSubmit(onTopUp)}
              className="space-y-4 mt-2"
            >
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (BDT) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="500"
                  {...topUpForm.register("amount")}
                />
                {topUpForm.formState.errors.amount && (
                  <p className="text-sm text-destructive">
                    {topUpForm.formState.errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Input
                  id="paymentMethod"
                  placeholder="bKash, Nagad, Card..."
                  {...topUpForm.register("paymentMethod")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentReference">
                  Payment Reference{" "}
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="paymentReference"
                  placeholder="Transaction ID"
                  {...topUpForm.register("paymentReference")}
                />
              </div>

              <Button type="submit" className="w-full" disabled={toppingUp}>
                {toppingUp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                    Processing...
                  </>
                ) : (
                  "Add Balance"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Balance card */}
      <Card
        className={
          account?.isLowBalance
            ? "border-amber-200 dark:border-amber-900"
            : ""
        }
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-4xl font-semibold mt-1">
                {formatCurrency(account?.balance ?? 0)}
              </p>
              {account?.isLowBalance && (
                <Badge
                  variant="outline"
                  className="mt-2 border-amber-500 text-amber-600 gap-1"
                >
                  <TrendingDown className="h-3 w-3" strokeWidth={2} />
                  Low Balance
                </Badge>
              )}
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Wallet className="h-7 w-7 text-primary" strokeWidth={1.75} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Minimum Balance</p>
              <p className="font-medium mt-0.5">
                {formatCurrency(account?.minimumBalance ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account Status</p>
              <div className="mt-0.5">
                {account?.isFrozen ? (
                  <Badge variant="destructive">Frozen</Badge>
                ) : (
                  <Badge variant="secondary">Active</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <ArrowUpRight className="h-5 w-5 text-emerald-600" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Topped Up</p>
                <p className="font-semibold">
                  {formatCurrency(account?.totalTopUpAmount ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {account?.totalTopUps ?? 0} top-ups
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <TrendingDown className="h-5 w-5 text-red-600" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Toll Paid</p>
                <p className="font-semibold">
                  {formatCurrency(account?.totalTollAmount ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {account?.totalTollDeductions ?? 0} deductions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-recharge status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
              Auto-Recharge
            </span>
            <Badge
              variant={account?.autoRecharge.isEnabled ? "default" : "secondary"}
            >
              {account?.autoRecharge.isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Automatically top up when balance falls below threshold
          </CardDescription>
        </CardHeader>
        {account?.autoRecharge.isEnabled && (
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Trigger Amount</p>
                <p className="font-medium mt-0.5">
                  {formatCurrency(account.autoRecharge.triggerAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recharge Amount</p>
                <p className="font-medium mt-0.5">
                  {formatCurrency(account.autoRecharge.rechargeAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}