"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Car,
  Search,
  ShieldAlert,
  Radio,
  Filter,
} from "lucide-react";

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

import { useQuery } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api/vehicles";

// ─────────────────────────────────────────────────────
//  admin/vehicles/page.tsx
//  Admin view — all vehicles in the system with
//  search by plate, filter by type/status, pagination.
// ─────────────────────────────────────────────────────

export default function AdminVehiclesPage() {
  const [search, setSearch] = useState("");
  const [vehicleType, setVehicleType] = useState("all");
  const [isBlacklisted, setIsBlacklisted] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["vehicles", "all", vehicleType, isBlacklisted, page],
    queryFn: () =>
      vehiclesApi.getAll({
        ...(vehicleType !== "all" && { vehicleType }),
        ...(isBlacklisted !== "all" && { isBlacklisted: isBlacklisted === "true" }),
        page,
        limit: 10,
      }),
  });

  const vehicles = (data?.data ?? []) as { _id: string; licensePlate: string; make: string; model: string; year: number; vehicleType: string; isBlacklisted: boolean; rfidTag?: string; owner: { name: string; email: string } }[];
  const pagination = data?.pagination;

  const filtered = search
    ? vehicles.filter(
        (v) =>
          v.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
          v.make.toLowerCase().includes(search.toLowerCase()) ||
          v.model.toLowerCase().includes(search.toLowerCase())
      )
    : vehicles;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold font-heading tracking-tight">
          All Vehicles
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage all registered vehicles in the system
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <Input
              placeholder="Search by plate, make, model..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={vehicleType} onValueChange={setVehicleType}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" strokeWidth={1.75} />
              <SelectValue placeholder="Vehicle type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="motorcycle">Motorcycle</SelectItem>
              <SelectItem value="car">Car</SelectItem>
              <SelectItem value="suv">SUV</SelectItem>
              <SelectItem value="van">Van</SelectItem>
              <SelectItem value="truck">Truck</SelectItem>
              <SelectItem value="bus">Bus</SelectItem>
            </SelectContent>
          </Select>

          <Select value={isBlacklisted} onValueChange={setIsBlacklisted}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="false">Active</SelectItem>
              <SelectItem value="true">Blacklisted</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicles</CardTitle>
          <CardDescription>
            {pagination?.total ?? 0} total vehicles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
              <Car className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">No vehicles found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>RFID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((vehicle) => (
                  <TableRow key={vehicle._id}>
                    <TableCell className="font-mono font-medium">
                      {vehicle.licensePlate}
                    </TableCell>
                    <TableCell>
                      {vehicle.make} {vehicle.model} {vehicle.year}
                    </TableCell>
                    <TableCell className="capitalize">
                      {vehicle.vehicleType}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{vehicle.owner?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.owner?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {vehicle.rfidTag ? (
                        <Badge variant="outline" className="gap-1 font-mono text-xs">
                          <Radio className="h-3 w-3" strokeWidth={2} />
                          {vehicle.rfidTag}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Not assigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {vehicle.isBlacklisted ? (
                        <Badge variant="destructive" className="gap-1">
                          <ShieldAlert className="h-3 w-3" strokeWidth={2} />
                          Blacklisted
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/admin/vehicles/${vehicle._id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
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