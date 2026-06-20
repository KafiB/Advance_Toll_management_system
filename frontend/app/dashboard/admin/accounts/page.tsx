"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Wallet, Lock, Unlock, SlidersHorizontal, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import api from "@/lib/api/axios";
import { Account, User } from "@/lib/api/types";

// ─────────────────────────────────────────────────────
//  admin/accounts/page.tsx
//  Admin view of all wallet accounts.
//  Can freeze/unfreeze and adjust balances.
// ─────────────────────────────────────────────────────

const adjustSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  type: z.enum(["add", "deduct"]),
  reason: z.string().min(3, "Reason is required"),
});

type AdjustValues = z.infer<typeof adjustSchema>;

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v) + " BDT";

export default function AdminAccountsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [freezeId, setFreezeId] = useState<string | null>(null);
  const [freezeReason, setFreezeReason] = useState("");
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-accounts", filter, page],
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = { page, limit: 10 };
      if (filter === "frozen") params.isFrozen = true;
      if (filter === "active") params.isFrozen = false;
      const res = await api.get("/accounts", { params });
      return res.data;
    },
  });

  const { mutate: freezeAccount, isPending: freezing } = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.put(`/accounts/${id}/freeze`, { reason }),
    onSuccess: () => {
      toast.success("Account frozen");
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      setFreezeId(null);
      setFreezeReason("");
    },
    onError: (error: { message: string }) => {
      toast.error("Failed", { description: error.message });
    },
  });

  const { mutate: unfreezeAccount, isPending: unfreezing } = useMutation({
    mutationFn: (id: string) => api.put(`/accounts/${id}/unfreeze`),
    onSuccess: () => {
      toast.success("Account unfrozen");
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
    onError: (error: { message: string }) => {
      toast.error("Failed", { description: error.message });
    },
  });

  const adjustForm = useForm<AdjustValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { type: "add" },
  });

  const { mutate: adjustBalance, isPending: adjusting } = useMutation({
    mutationFn: ({ id, values }: { id: string; values: AdjustValues }) =>
      api.put(`/accounts/${id}/adjust-balance`, values),
    onSuccess: () => {
      toast.success("Balance adjusted");
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      setAdjustId(null);
      adjustForm.reset();
    },
    onError: (error: { message: string }) => {
      toast.error("Adjustment failed", { description: error.message });
    },
  });

  const accounts = (data?.data ?? []) as Account[];
  const pagination = data?.pagination;

  const filtered = search
    ? accounts.filter((a) => {
        const owner = a.owner as User;
        return (
          owner?.name?.toLowerCase().includes(search.toLowerCase()) ||
          a.accountNumber?.toLowerCase().includes(search.toLowerCase())
        );
      })
    : accounts;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-heading tracking-tight">Accounts</h1>
        <p className="text-muted-foreground mt-1">Manage all wallet accounts</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          <Input
            placeholder="Search by name or account number..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="frozen">Frozen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" strokeWidth={1.75} />
            Wallet Accounts
          </CardTitle>
          <CardDescription>{pagination?.total ?? 0} total accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-sm text-muted-foreground">No accounts found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Account No.</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((account) => {
                  const owner = account.owner as User;
                  return (
                    <TableRow key={account._id}>
                      <TableCell>
                        <p className="font-medium text-sm">{owner?.name}</p>
                        <p className="text-xs text-muted-foreground">{owner?.email}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {account.accountNumber}
                      </TableCell>
                      <TableCell className={`font-medium ${account.isLowBalance ? "text-amber-600" : ""}`}>
                        {formatCurrency(account.balance)}
                      </TableCell>
                      <TableCell>
                        {account.isFrozen ? (
                          <Badge variant="destructive">Frozen</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {account.isFrozen ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => unfreezeAccount(account._id)}
                              disabled={unfreezing}
                            >
                              <Unlock className="h-3.5 w-3.5" strokeWidth={1.75} />
                              Unfreeze
                            </Button>
                          ) : (
                            <Dialog
                              open={freezeId === account._id}
                              onOpenChange={(open) => {
                                if (!open) { setFreezeId(null); setFreezeReason(""); }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setFreezeId(account._id)}>
                                  <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
                                  Freeze
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Freeze Account</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 mt-2">
                                  <div className="space-y-2">
                                    <Label>Reason *</Label>
                                    <Textarea
                                      placeholder="Reason for freezing..."
                                      value={freezeReason}
                                      onChange={(e) => setFreezeReason(e.target.value)}
                                    />
                                  </div>
                                  <Button
                                    className="w-full"
                                    variant="destructive"
                                    disabled={!freezeReason.trim() || freezing}
                                    onClick={() => freezeAccount({ id: account._id, reason: freezeReason })}
                                  >
                                    {freezing ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : "Freeze Account"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}

                          <Dialog
                            open={adjustId === account._id}
                            onOpenChange={(open) => {
                              if (!open) { setAdjustId(null); adjustForm.reset(); }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => setAdjustId(account._id)}>
                                <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adjust Balance — {owner?.name}</DialogTitle>
                              </DialogHeader>
                              <p className="text-sm text-muted-foreground">
                                Current: {formatCurrency(account.balance)}
                              </p>
                              <form
                                onSubmit={adjustForm.handleSubmit((v) =>
                                  adjustBalance({ id: account._id, values: v })
                                )}
                                className="space-y-3 mt-2"
                              >
                                <div className="space-y-2">
                                  <Label>Type</Label>
                                  <Select
                                    defaultValue="add"
                                    onValueChange={(v) => adjustForm.setValue("type", v as "add" | "deduct")}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="add">Add Balance</SelectItem>
                                      <SelectItem value="deduct">Deduct Balance</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Amount (BDT) *</Label>
                                  <Input type="number" placeholder="100" {...adjustForm.register("amount")} />
                                  {adjustForm.formState.errors.amount && (
                                    <p className="text-sm text-destructive">{adjustForm.formState.errors.amount.message}</p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label>Reason *</Label>
                                  <Input placeholder="Correction, refund, etc." {...adjustForm.register("reason")} />
                                  {adjustForm.formState.errors.reason && (
                                    <p className="text-sm text-destructive">{adjustForm.formState.errors.reason.message}</p>
                                  )}
                                </div>
                                <Button type="submit" className="w-full" disabled={adjusting}>
                                  {adjusting ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : "Apply Adjustment"}
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === pagination.totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}