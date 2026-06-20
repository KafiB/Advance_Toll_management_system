"use client";

import { use } from "react";
import Link from "next/link";
import {
  Car,
  Edit,
  Calendar,
  Shield,
  Radio,
  ShieldAlert,
  CheckCircle2,
  ArrowLeft,
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

import { useVehicle } from "@/lib/hooks/use-vehicles";

// ─────────────────────────────────────────────────────
//  vehicles/[id]/page.tsx
//  Shows full details for a single vehicle.
//  Includes registration info, RFID status,
//  blacklist status, and trip statistics.
// ─────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between py-3 border-b last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
  </div>
);

export default function VehicleDetailsPage({ params }: Props) {
  const { id } = use(params);
  const { data, isLoading } = useVehicle(id);
  const vehicle = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-3 text-center">
        <Car className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
        <p className="font-medium">Vehicle not found</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/user/vehicles">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Back to My Vehicles
          </Link>
        </Button>
      </div>
    );
  }

  const isExpired = new Date(vehicle.registrationExpiry) < new Date();

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/user/vehicles">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            My Vehicles
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/dashboard/user/vehicles/${id}/edit`}>
            <Edit className="h-4 w-4" strokeWidth={1.75} />
            Edit Vehicle
          </Link>
        </Button>
      </div>

      {/* Vehicle header card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Car className="h-7 w-7 text-primary" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold font-heading">
                  {vehicle.licensePlate}
                </h1>
                {vehicle.isBlacklisted ? (
                  <Badge variant="destructive" className="gap-1">
                    <ShieldAlert className="h-3 w-3" strokeWidth={2} />
                    Blacklisted
                  </Badge>
                ) : (
                  <Badge className="gap-1">
                    <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                {vehicle.make} {vehicle.model} • {vehicle.year} • {vehicle.color}
              </p>
              <Badge variant="outline" className="capitalize mt-2">
                {vehicle.vehicleType}
              </Badge>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t">
            <div className="text-center">
              <p className="text-2xl font-semibold">{vehicle.totalTrips}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Trips</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">
                {vehicle.totalTollPaid.toLocaleString()} BDT
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total Toll Paid</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" strokeWidth={1.75} />
            Registration Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DetailRow
            label="Registration Number"
            value={vehicle.registrationNumber}
          />
          <DetailRow
            label="Registration Expiry"
            value={new Date(vehicle.registrationExpiry).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
          {vehicle.insuranceNumber && (
            <DetailRow
              label="Insurance Number"
              value={vehicle.insuranceNumber}
            />
          )}
          {vehicle.insuranceExpiry && (
            <DetailRow
              label="Insurance Expiry"
              value={new Date(vehicle.insuranceExpiry).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
          )}
          {isExpired && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3">
              <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" strokeWidth={1.75} />
              <p className="text-sm text-red-600">
                Registration has expired. Please renew your registration.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RFID Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Radio className="h-4 w-4" strokeWidth={1.75} />
            RFID Tag
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vehicle.rfidTag ? (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" strokeWidth={1.75} />
              <div>
                <p className="font-medium text-sm">RFID Tag Assigned</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {vehicle.rfidTag}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4">
              <Radio className="h-5 w-5 text-amber-600 shrink-0" strokeWidth={1.75} />
              <div>
                <p className="font-medium text-sm">No RFID Tag</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Visit a toll registration office to get an RFID tag assigned to this vehicle.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blacklist info */}
      {vehicle.isBlacklisted && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-600">
              <Shield className="h-4 w-4" strokeWidth={1.75} />
              Blacklist Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This vehicle has been blacklisted for the following reason:
            </p>
            <p className="text-sm font-medium mt-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
              {vehicle.blacklistReason}
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Contact support or visit your nearest toll office to resolve this issue.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}