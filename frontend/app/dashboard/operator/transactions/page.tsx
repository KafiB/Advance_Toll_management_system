"use client";

import { useState } from "react";
import { Search, Receipt } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { useAuthStore } from "@/lib/store/auth-store";
import { useBooths } from "@/lib/hooks/use-booths";
import { useBoothTransactions } from "@/lib/hooks/use-transactions";
import { Booth, Transaction, User } from "@/lib/api/types";

// ─────────────────────────────────────────────────────
//  operator/transactions/page.tsx
//  Shows all transactions at the operator's booth.
// ─────────────────────────────────────────────────────

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v) + " BDT";

export default function OperatorTransactionsPage() {
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const { data: boothsRes } = useBooths();

  const myBooth = (boothsRes?.data ?? []).find((booth: Booth) => {
    if (!booth.assignedOperator) return false;
    const op = booth.assignedOperator as User;
    return op._id === user?.id || op.id === user?.id;
  }) as Booth | undefined;

  const { data, isLoading } = useBoothTransactions(myBooth?._id, {
    ...(status !== "all" && { status }),
    page,
    limit: 10,
  });

  const transactions = (data?.data ?? []) as Transaction[];
  const pagination = data?.pagination;

  const filtered = search
    ? transactions.filter((tx) =>
        tx.transactionRef?.toLowerCase().includes(search.toLowerCase()) ||
        tx.tollDetails?.licensePlate?.toLowerCase().includes(search.toLowerCase())
      )
    : transactions;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-heading tracking-tight">
          Transactions
        </h1>
        <p className="text-muted-foreground mt-1">
          {myBooth ? `Transactions at ${myBooth.name}` : "No booth assigned"}
        </p>
      </div>

      {!myBooth ? (
        <Card>
          <CardContent className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No booth assigned. Contact admin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              <Input
                placeholder="Search by reference or plate..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Booth Transactions</CardTitle>
              <CardDescription>{pagination?.total ?? 0} total transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex h-[200px] flex-col items-center justify-center gap-2">
                  <Receipt className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                  <p className="text-sm text-muted-foreground">No transactions found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>License Plate</TableHead>
                      <TableHead>Vehicle Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((tx) => (
                      <TableRow key={tx._id}>
                        <TableCell className="font-mono text-xs">
                          {tx.transactionRef}
                        </TableCell>
                        <TableCell className="font-medium">
                          {tx.tollDetails?.licensePlate ?? "—"}
                        </TableCell>
                        <TableCell className="capitalize text-sm text-muted-foreground">
                          {tx.tollDetails?.vehicleType ?? "—"}
                        </TableCell>
                        <TableCell className="font-medium">
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
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === pagination.totalPages}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}