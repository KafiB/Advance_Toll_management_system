"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Car } from "lucide-react";

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

import { vehicleSchema, VehicleFormValues, vehicleTypeOptions } from "@/lib/validations/vehicle";
import { useRegisterVehicle } from "@/lib/hooks/use-vehicles";

// ─────────────────────────────────────────────────────
//  vehicles/register/page.tsx
//  Form for registering a new vehicle.
//  On success → redirects to /my-vehicles list.
// ─────────────────────────────────────────────────────

export default function RegisterVehiclePage() {
  const router = useRouter();
  const { mutate: registerVehicle, isPending } = useRegisterVehicle();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
  });

  const onSubmit = (values: VehicleFormValues) => {
    
    registerVehicle(values, {
      onSuccess: () => {
        router.push("/dashboard/user/vehicles");
      },
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold font-heading tracking-tight">
          Register Vehicle
        </h1>
        <p className="text-muted-foreground mt-1">
          Add a new vehicle to your account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic vehicle info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4" strokeWidth={1.75} />
              Vehicle Information
            </CardTitle>
            <CardDescription>
              Basic details about your vehicle
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {/* License Plate */}
            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate *</Label>
              <Input
                id="licensePlate"
                placeholder="DHA-1234"
                {...register("licensePlate")}
              />
              {errors.licensePlate && (
                <p className="text-sm text-destructive">
                  {errors.licensePlate.message}
                </p>
              )}
            </div>

            {/* Vehicle Type */}
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type *</Label>
              <Select
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

            {/* Make */}
            <div className="space-y-2">
              <Label htmlFor="make">Make *</Label>
              <Input
                id="make"
                placeholder="Toyota"
                {...register("make")}
              />
              {errors.make && (
                <p className="text-sm text-destructive">{errors.make.message}</p>
              )}
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                placeholder="Camry"
                {...register("model")}
              />
              {errors.model && (
                <p className="text-sm text-destructive">{errors.model.message}</p>
              )}
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                  id="year"
                  type="number"
                  placeholder="2020"
                  {...register("year")}
                />
              {errors.year && (
                <p className="text-sm text-destructive">{errors.year.message}</p>
              )}
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Color *</Label>
              <Input
                id="color"
                placeholder="White"
                {...register("color")}
              />
              {errors.color && (
                <p className="text-sm text-destructive">{errors.color.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Registration details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registration Details</CardTitle>
            <CardDescription>
              Official registration information
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {/* Registration Number */}
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration Number *</Label>
              <Input
                id="registrationNumber"
                placeholder="REG-2020-001"
                {...register("registrationNumber")}
              />
              {errors.registrationNumber && (
                <p className="text-sm text-destructive">
                  {errors.registrationNumber.message}
                </p>
              )}
            </div>

            {/* Registration Expiry */}
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

            {/* Insurance Number */}
            <div className="space-y-2">
              <Label htmlFor="insuranceNumber">
                Insurance Number{" "}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="insuranceNumber"
                placeholder="INS-001"
                {...register("insuranceNumber")}
              />
            </div>

            {/* Insurance Expiry */}
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

        {/* Submit */}
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
                Registering...
              </>
            ) : (
              "Register Vehicle"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}