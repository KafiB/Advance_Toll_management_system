"use client";

import { use } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Radio,
  Wrench,
  TrendingUp,
  Edit,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useBooth } from "@/lib/hooks/use-booths";
import { boothsApi } from "@/lib/api/booths";
import { User } from "@/lib/api/types";

// ─────────────────────────────────────────────────────
//  admin/booths/[id]/page.tsx
//  Full booth detail with stats, operator info,
//  toll rates, and status management.
// ─────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  operational: "default",
  maintenance: "secondary",
  closed: "destructive",
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v) + " BDT";

export default function BoothDetailPage({ params }: Props) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { data, isLoading } = useBooth(id);
  const booth = data?.data;

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: (status: string) => boothsApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success("Booth status updated");
      queryClient.invalidateQueries({ queryKey: ["booths", id] });
    },
    onError: (error: { message: string }) => {
      toast.error("Update failed", { description: error.message });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[150px] rounded-xl" />
      </div>
    );
  }

  if (!booth) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-3">
        <Building2 className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
        <p className="font-medium">Booth not found</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin/booths">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Back to Booths
          </Link>
        </Button>
      </div>
    );
  }

  const operator = booth.assignedOperator as User | null;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/admin/booths">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Booths
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/admin/booths/${id}/edit`}>
            <Edit className="h-4 w-4" strokeWidth={1.75} />
            Edit Booth
          </Link>
        </Button>
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
                <h1 className="text-xl font-semibold font-heading">
                  {booth.name}
                </h1>
                <Badge
                  variant={statusVariant[booth.status]}
                  className="capitalize"
                >
                  {booth.status}
                </Badge>
              </div>
              <p className="text-sm font-mono text-muted-foreground mt-0.5">
                {booth.boothCode}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                {booth.location.address}, {booth.location.city} •{" "}
                {booth.highwayName}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="font-semibold mt-0.5">
                {formatCurrency(booth.totalRevenue)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Transactions</p>
              <p className="font-semibold mt-0.5">{booth.totalTransactions}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Today Revenue</p>
              <p className="font-semibold mt-0.5 text-emerald-600">
                {formatCurrency(booth.todayRevenue)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Active Lanes</p>
              <p className="font-semibold mt-0.5">
                {booth.activeLanes}/{booth.totalLanes}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Status management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-4 w-4" strokeWidth={1.75} />
              Status Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              defaultValue={booth.status}
              onValueChange={(val) => updateStatus(val)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="maintenance">Under Maintenance</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Changing status affects toll processing at this booth
            </p>
          </CardContent>
        </Card>

        {/* Operator info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Radio className="h-4 w-4" strokeWidth={1.75} />
              Assigned Operator
            </CardTitle>
          </CardHeader>
          <CardContent>
            {operator ? (
              <div className="space-y-1">
                <p className="font-medium">{operator.name}</p>
                <p className="text-sm text-muted-foreground">{operator.email}</p>
                <p className="text-sm text-muted-foreground">{operator.phone}</p>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <Link href="/dashboard/admin/operators">
                    Manage Operators
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-amber-600">No operator assigned</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/admin/operators">
                    Assign Operator
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
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
            {Object.entries(booth.tollRates).map(([type, rate]) => (
              <div
                key={type}
                className="flex flex-col items-center rounded-lg border p-3 text-center"
              >
                <p className="text-xs text-muted-foreground capitalize">{type}</p>
                <p className="font-semibold mt-1">{rate} BDT</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}