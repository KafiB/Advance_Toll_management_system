"use client";

import Link from "next/link";
import { Plus, Car, ShieldAlert, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useMyVehicles } from "@/lib/hooks/use-vehicles";

// ─────────────────────────────────────────────────────
//  user/vehicles/page.tsx
//  Lists all vehicles registered by the logged-in user
//  as cards. Each card links to vehicle details.
// ─────────────────────────────────────────────────────

const vehicleTypeColors: Record<string, string> = {
  motorcycle: "bg-amber-500/10 text-amber-600",
  car: "bg-blue-500/10 text-blue-600",
  suv: "bg-violet-500/10 text-violet-600",
  van: "bg-emerald-500/10 text-emerald-600",
  truck: "bg-orange-500/10 text-orange-600",
  bus: "bg-rose-500/10 text-rose-600",
};

export default function MyVehiclesPage() {
  const { data, isLoading } = useMyVehicles();
  const vehicles = data?.data?.vehicles ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-heading tracking-tight">
            My Vehicles
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your registered vehicles and RFID tags
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/user/vehicles/register">
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Register Vehicle
          </Link>
        </Button>
      </div>

      {/* Vehicle grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[160px] rounded-xl" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Car className="h-6 w-6 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-medium">No vehicles registered yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Register your first vehicle to start using toll services.
              </p>
            </div>
            <Button asChild className="mt-2">
              <Link href="/dashboard/user/vehicles/register">
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                Register Vehicle
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Link key={vehicle._id} href={`/dashboard/user/vehicles/${vehicle._id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        vehicleTypeColors[vehicle.vehicleType]
                      }`}
                    >
                      <Car className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    {vehicle.isBlacklisted ? (
                      <Badge variant="destructive" className="gap-1">
                        <ShieldAlert className="h-3 w-3" strokeWidth={2} />
                        Blacklisted
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="capitalize">
                        {vehicle.vehicleType}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <p className="font-semibold text-lg tracking-wide">
                      {vehicle.licensePlate}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.make} {vehicle.model} • {vehicle.year} • {vehicle.color}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <div>
                      <p className="text-muted-foreground text-xs">RFID Tag</p>
                      <p className="font-medium">
                        {vehicle.rfidTag ?? "Not assigned"}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
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