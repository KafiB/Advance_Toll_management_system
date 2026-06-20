"use client";

import { useState } from "react";
import { Search, Receipt, Filter } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAllTransactions } from "@/lib/hooks/use-transactions";
import { Transaction, User } from "@/lib/api/types";

// ─────────────────────────────────────────────────────
//  admin/transactions/page.tsx
//  Admin view of ALL system transactions.
//  Includes user info and booth info per transaction.
// ─────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value) + " BDT";

export default function AdminTransactionsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAllTransactions({
    ...(type !== "all" && { type }),
    ...(status !== "all" && { status }),
    page,
    limit: 10,
  });

  const transactions = (data?.data ?? []) as Transaction[];
  const pagination = data?.pagination;

  const filtered = search
    ? transactions.filter((tx) =>
        tx.transactionRef?.toLowerCase().includes(search.toLowerCase()) ||
        (typeof tx.user === "object" &&
          (tx.user as User).name?.toLowerCase().includes(search.toLowerCase()))
      )
    : transactions;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-heading tracking-tight">
          All Transactions
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete transaction history across all booths
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            strokeWidth={1.75}
          />
          <Input
            placeholder="Search by reference or user..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-1" strokeWidth={1.75} />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="toll">Toll</SelectItem>
            <SelectItem value="topup">Top Up</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
          </SelectContent>
        </Select>

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
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {pagination?.total ?? 0} total transactions
          </CardDescription>
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
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Booth</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell className="font-mono text-xs">
                      {tx.transactionRef}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">
                        {typeof tx.user === "object"
                          ? (tx.user as User).name
                          : "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.status === "success" ? "default" : "destructive"
                        }
                        className="capitalize"
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tx.tollDetails?.boothCode ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tx.tollDetails?.licensePlate ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}