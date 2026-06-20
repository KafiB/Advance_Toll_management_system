"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { boothsApi } from "@/lib/api/booths";

// ─────────────────────────────────────────────────────
//  admin/booths/create/page.tsx
//  Form for creating a new toll booth.
// ─────────────────────────────────────────────────────

const boothSchema = z.object({
  name: z.string().min(3, "Booth name is required"),
  boothCode: z.string().min(2, "Booth code is required").toUpperCase(),
  highwayName: z.string().min(2, "Highway name is required"),
  highwayNumber: z.string().optional(),
  totalLanes: z.coerce.number().min(1).max(20),
  address: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  description: z.string().optional(),
  motorcycle: z.coerce.number().min(0).default(50),
  car: z.coerce.number().min(0).default(100),
  suv: z.coerce.number().min(0).default(150),
  van: z.coerce.number().min(0).default(200),
  truck: z.coerce.number().min(0).default(300),
  bus: z.coerce.number().min(0).default(300),
});

type BoothFormValues = z.infer<typeof boothSchema>;

export default function CreateBoothPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: createBooth, isPending } = useMutation({
    mutationFn: (values: BoothFormValues) =>
      boothsApi.create({
        name: values.name,
        boothCode: values.boothCode,
        highwayName: values.highwayName,
        highwayNumber: values.highwayNumber,
        totalLanes: values.totalLanes,
        description: values.description,
        location: {
          address: values.address,
          city: values.city,
          state: values.state,
        },
        tollRates: {
          motorcycle: values.motorcycle,
          car: values.car,
          suv: values.suv,
          van: values.van,
          truck: values.truck,
          bus: values.bus,
        },
      }),
    onSuccess: () => {
      toast.success("Booth created successfully");
      queryClient.invalidateQueries({ queryKey: ["booths"] });
      router.push("/dashboard/admin/booths");
    },
    onError: (error: { message: string }) => {
      toast.error("Failed to create booth", { description: error.message });
    },
  });

  const { register, handleSubmit, formState: { errors } } =
    useForm<BoothFormValues>({
      resolver: zodResolver(boothSchema),
      defaultValues: {
        totalLanes: 4,
        motorcycle: 50,
        car: 100,
        suv: 150,
        van: 200,
        truck: 300,
        bus: 300,
      },
    });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-heading tracking-tight">
          Create Toll Booth
        </h1>
        <p className="text-muted-foreground mt-1">
          Add a new toll plaza to the system
        </p>
      </div>

      <form onSubmit={handleSubmit((v) => createBooth(v))} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" strokeWidth={1.75} />
              Booth Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Booth Name *</Label>
              <Input id="name" placeholder="Dhaka-Chittagong Highway Plaza 1" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="boothCode">Booth Code *</Label>
              <Input id="boothCode" placeholder="DCH-001" {...register("boothCode")} />
              {errors.boothCode && <p className="text-sm text-destructive">{errors.boothCode.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalLanes">Total Lanes *</Label>
              <Input id="totalLanes" type="number" {...register("totalLanes")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="highwayName">Highway Name *</Label>
              <Input id="highwayName" placeholder="Dhaka-Chittagong Highway" {...register("highwayName")} />
              {errors.highwayName && <p className="text-sm text-destructive">{errors.highwayName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="highwayNumber">Highway Number</Label>
              <Input id="highwayNumber" placeholder="N1" {...register("highwayNumber")} />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Input id="address" placeholder="Kanchpur Bridge, Sonargaon" {...register("address")} />
              {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" placeholder="Narayanganj" {...register("city")} />
              {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Division *</Label>
              <Input id="state" placeholder="Dhaka Division" {...register("state")} />
              {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Toll Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Toll Rates (BDT)</CardTitle>
            <CardDescription>Set the toll charge per vehicle type</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            {["motorcycle", "car", "suv", "van", "truck", "bus"].map((type) => (
              <div key={type} className="space-y-2">
                <Label htmlFor={type} className="capitalize">{type}</Label>
                <Input
                  id={type}
                  type="number"
                  {...register(type as keyof BoothFormValues)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                Creating...
              </>
            ) : (
              "Create Booth"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}