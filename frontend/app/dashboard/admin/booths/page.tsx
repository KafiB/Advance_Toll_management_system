"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Building2, Search, MapPin, Radio } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import { useBooths } from "@/lib/hooks/use-booths";
import { Booth, User } from "@/lib/api/types";

// ─────────────────────────────────────────────────────
//  admin/booths/page.tsx
//  Lists all toll booths with status, operator,
//  and revenue. Admin can create and manage booths.
// ─────────────────────────────────────────────────────

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  operational: "default",
  maintenance: "secondary",
  closed: "destructive",
};

export default function AdminBoothsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data, isLoading } = useBooths({
    ...(status !== "all" && { status }),
  });

  const booths = (data?.data ?? []) as Booth[];

  const filtered = search
    ? booths.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.boothCode.toLowerCase().includes(search.toLowerCase()) ||
          b.highwayName.toLowerCase().includes(search.toLowerCase())
      )
    : booths;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-heading tracking-tight">
            Toll Booths
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage toll plazas and lane configurations
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/booths/create">
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Create Booth
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            strokeWidth={1.75}
          />
          <Input
            placeholder="Search by name, code, highway..."
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
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="operational">Operational</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Booth cards grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">No booths found</p>
            <Button asChild size="sm">
              <Link href="/dashboard/admin/booths/create">Create First Booth</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((booth) => (
            <Link key={booth._id} href={`/dashboard/admin/booths/${booth._id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" strokeWidth={1.75} />
                    </div>
                    <Badge
                      variant={statusVariant[booth.status]}
                      className="capitalize"
                    >
                      {booth.status}
                    </Badge>
                  </div>

                  <div>
                    <p className="font-semibold">{booth.name}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {booth.boothCode}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" strokeWidth={1.75} />
                      {booth.location.city} • {booth.highwayName}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t">
                    <span className="text-muted-foreground">
                      {booth.activeLanes}/{booth.totalLanes} lanes
                    </span>
                    {booth.assignedOperator ? (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Radio className="h-3 w-3" strokeWidth={2} />
                        {typeof booth.assignedOperator === "object"
                          ? (booth.assignedOperator as User).name
                          : "Assigned"}
                      </span>
                    ) : (
                      <span className="text-amber-600">No operator</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}