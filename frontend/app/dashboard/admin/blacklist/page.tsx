"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Car,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { blacklistApi } from "@/lib/api/blacklist";
import { BlacklistRecord, User, Vehicle } from "@/lib/api/types";

// ─────────────────────────────────────────────────────
//  admin/blacklist/page.tsx
//  Admin view of all blacklisted vehicles.
//  Allows resolving blacklists with resolution notes.
// ─────────────────────────────────────────────────────

export default function AdminBlacklistPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
  queryKey: ["blacklist", status],
  queryFn: () => blacklistApi.getAll({
    status,
    limit: 50,
  }),
  });

  const { mutate: resolveBlacklist, isPending: resolving } = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      blacklistApi.resolve(id, notes),
    onSuccess: () => {
      toast.success("Blacklist resolved successfully");
      queryClient.invalidateQueries({ queryKey: ["blacklist"] });
      setResolveId(null);
      setResolutionNotes("");
    },
    onError: (error: { message: string }) => {
      toast.error("Failed to resolve", { description: error.message });
    },
  });

  const records = (data?.data ?? []) as BlacklistRecord[];

  const filtered = search
    ? records.filter((r) => {
        const plate = r.vehicleSnapshot?.licensePlate?.toLowerCase() ?? "";
        const name = r.ownerSnapshot?.name?.toLowerCase() ?? "";
        return (
          plate.includes(search.toLowerCase()) ||
          name.includes(search.toLowerCase())
        );
      })
    : records;

  const reasonLabels: Record<string, string> = {
    unpaid_tolls: "Unpaid Tolls",
    fraud: "Fraud",
    stolen: "Stolen",
    document_expired: "Document Expired",
    other: "Other",
    pending_review: "Pending Review",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-heading tracking-tight">
          Blacklist Management
        </h1>
        <p className="text-muted-foreground mt-1">
          View and manage blacklisted vehicles
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
            placeholder="Search by plate or owner..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600" strokeWidth={1.75} />
            Blacklisted Vehicles
          </CardTitle>
          <CardDescription>
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
              <ShieldCheck className="h-8 w-8 text-emerald-600" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">
                No {status} blacklist records
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Unpaid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                        <div>
                          <p className="font-medium text-sm">
                            {record.vehicleSnapshot?.licensePlate ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {record.vehicleSnapshot?.vehicleType}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">
                        {record.ownerSnapshot?.name ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.ownerSnapshot?.email}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {reasonLabels[record.reason] ?? record.reason}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.unpaidAmount > 0
                        ? `${record.unpaidAmount} BDT`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          record.status === "active"
                            ? "destructive"
                            : record.status === "resolved"
                            ? "default"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(record.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      {record.status !== "resolved" && (
                        <Dialog
                          open={resolveId === record._id}
                          onOpenChange={(open) => {
                            if (!open) {
                              setResolveId(null);
                              setResolutionNotes("");
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setResolveId(record._id)}
                            >
                              Resolve
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Resolve Blacklist</DialogTitle>
                              <DialogDescription>
                                Vehicle: {record.vehicleSnapshot?.licensePlate}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 mt-2">
                              <div className="space-y-2">
                                <Label>Resolution Notes *</Label>
                                <Textarea
                                  placeholder="Describe how this was resolved (e.g. dues paid, vehicle cleared)..."
                                  value={resolutionNotes}
                                  onChange={(e) =>
                                    setResolutionNotes(e.target.value)
                                  }
                                  rows={3}
                                />
                              </div>
                              <Button
                                className="w-full"
                                disabled={!resolutionNotes.trim() || resolving}
                                onClick={() =>
                                  resolveBlacklist({
                                    id: record._id,
                                    notes: resolutionNotes,
                                  })
                                }
                              >
                                {resolving ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                                    Resolving...
                                  </>
                                ) : (
                                  "Confirm Resolution"
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}