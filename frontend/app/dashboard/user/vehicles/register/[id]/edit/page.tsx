"use client";

import { use, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Car, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { vehicleSchema, VehicleFormValues, vehicleTypeOptions } from "@/lib/validations/vehicle";
import { useVehicle } from "@/lib/hooks/use-vehicles";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api/vehicles";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────
//  vehicles/[id]/edit/page.tsx
//  Pre-fills form with existing vehicle data.
//  On success → goes back to vehicle details.
// ─────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditVehiclePage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useVehicle(id);
  const vehicle = data?.data;

  const { mutate: updateVehicle, isPending } = useMutation({
    mutationFn: (values: Partial<VehicleFormValues>) =>
      vehiclesApi.update(id, values),
    onSuccess: () => {
      toast.success("Vehicle updated successfully");
      queryClient.invalidateQueries({ queryKey: ["vehicles", id] });
      queryClient.invalidateQueries({ queryKey: ["vehicles", "my-vehicles"] });
      router.push(`/dashboard/user/vehicles/${id}`);
    },
    onError: (error: { message: string }) => {
      toast.error("Update failed", { description: error.message });
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
  });

  // Pre-fill form when vehicle data loads
  useEffect(() => {
    if (vehicle) {
      reset({
        licensePlate: vehicle.licensePlate,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        vehicleType: vehicle.vehicleType,
        registrationNumber: vehicle.registrationNumber,
        registrationExpiry: vehicle.registrationExpiry?.split("T")[0] ?? "",
        insuranceNumber: vehicle.insuranceNumber ?? "",
        insuranceExpiry: vehicle.insuranceExpiry?.split("T")[0] ?? "",
      });
    }
  }, [vehicle, reset]);

  const onSubmit = (values: VehicleFormValues) => {
    // Only send updatable fields (backend whitelist)
    updateVehicle({
      make: values.make,
      model: values.model,
      year: values.year,
      color: values.color,
      vehicleType: values.vehicleType,
      registrationExpiry: values.registrationExpiry,
      insuranceNumber: values.insuranceNumber,
      insuranceExpiry: values.insuranceExpiry,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/user/vehicles/${id}`}>
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold font-heading tracking-tight">
            Edit Vehicle
          </h1>
          <p className="text-muted-foreground text-sm">
            {vehicle?.licensePlate} — {vehicle?.make} {vehicle?.model}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4" strokeWidth={1.75} />
              Vehicle Information
            </CardTitle>
            <CardDescription>
              Note: License plate cannot be changed after registration
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {/* License plate — read only */}
            <div className="space-y-2">
              <Label>License Plate</Label>
              <Input value={vehicle?.licensePlate} disabled className="bg-muted" />
            </div>

            {/* Vehicle Type */}
            <div className="space-y-2">
              <Label>Vehicle Type *</Label>
              <Select
                defaultValue={vehicle?.vehicleType}
                onValueChange={(val) =>
                  setValue("vehicleType", val as VehicleFormValues["vehicleType"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicleType && (
                <p className="text-sm text-destructive">
                  {errors.vehicleType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="make">Make *</Label>
              <Input id="make" placeholder="Toyota" {...register("make")} />
              {errors.make && (
                <p className="text-sm text-destructive">{errors.make.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input id="model" placeholder="Camry" {...register("model")} />
              {errors.model && (
                <p className="text-sm text-destructive">{errors.model.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input id="year" type="number" {...register("year")} />
              {errors.year && (
                <p className="text-sm text-destructive">{errors.year.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color *</Label>
              <Input id="color" placeholder="White" {...register("color")} />
              {errors.color && (
                <p className="text-sm text-destructive">{errors.color.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registration & Insurance</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Registration Number</Label>
              <Input
                value={vehicle?.registrationNumber}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationExpiry">Registration Expiry *</Label>
              <Input
                id="registrationExpiry"
                type="date"
                {...register("registrationExpiry")}
              />
              {errors.registrationExpiry && (
                <p className="text-sm text-destructive">
                  {errors.registrationExpiry.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="insuranceNumber">
                Insurance Number{" "}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input id="insuranceNumber" {...register("insuranceNumber")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insuranceExpiry">
                Insurance Expiry{" "}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="insuranceExpiry"
                type="date"
                {...register("insuranceExpiry")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}