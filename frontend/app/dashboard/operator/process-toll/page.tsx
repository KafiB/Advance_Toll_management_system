"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Radio,
  Car,
  Wallet,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { useAuthStore } from "@/lib/store/auth-store";
import { useBooths } from "@/lib/hooks/use-booths";
import { useProcessToll } from "@/lib/hooks/use-transactions";
import { Booth } from "@/lib/api/types";

// ─────────────────────────────────────────────────────
//  operator/process-toll/page.tsx
//  Core operator feature — processes a toll when a
//  vehicle passes through the booth.
//
//  Operator can search by:
//  - RFID tag (scanned automatically in real systems)
//  - License plate (manual fallback)
//
//  Shows result immediately with:
//  - Vehicle details
//  - Amount charged
//  - New balance
//  - Success or failure status
// ─────────────────────────────────────────────────────

const tollSchema = z.object({
  searchType: z.enum(["rfid", "plate"]),
  rfidTag: z.string().optional(),
  licensePlate: z.string().optional(),
});

type TollFormValues = z.infer<typeof tollSchema>;

interface TollResult {
  success: boolean;
  transactionRef?: string;
  amount?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  vehicle?: {
    licensePlate: string;
    vehicleType: string;
    owner: string;
  };
  booth?: {
    name: string;
    boothCode: string;
  };
  discount?: number;
  discountReason?: string;
  errorMessage?: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value) + " BDT";

export default function ProcessTollPage() {
  const user = useAuthStore((state) => state.user);
  const [searchType, setSearchType] = useState<"rfid" | "plate">("plate");
  const [result, setResult] = useState<TollResult | null>(null);
  const { data: boothsRes } = useBooths();
  const { mutate: processToll, isPending } = useProcessToll();

  // Find this operator's assigned booth
  const myBooth = boothsRes?.data?.find(
    (booth: Booth) =>
      typeof booth.assignedOperator === "object" &&
      booth.assignedOperator?.id === user?.id
  );

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<TollFormValues>({
      resolver: zodResolver(tollSchema),
      defaultValues: { searchType: "plate" },
    });

  const onSubmit = (values: TollFormValues) => {
    if (!myBooth) return;

    setResult(null);

    const payload = {
      boothId: myBooth._id,
      ...(searchType === "rfid"
        ? { rfidTag: values.rfidTag }
        : { licensePlate: values.licensePlate }),
    };

    processToll(payload, {
      onSuccess: (response) => {
        const data = response.data as TollResult & Record<string, unknown>;
        setResult({
          success: true,
          transactionRef: data?.transactionRef as string,
          amount: data?.amount as number,
          balanceBefore: data?.balanceBefore as number,
          balanceAfter: data?.balanceAfter as number,
          vehicle: data?.vehicle as TollResult["vehicle"],
          booth: data?.booth as TollResult["booth"],
          discount: data?.discount as number,
          discountReason: data?.discountReason as string,
        });
        reset();
      },
      onError: (error: { message: string }) => {
        setResult({ success: false, errorMessage: error.message });
      },
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold font-heading tracking-tight">
          Process Toll
        </h1>
        <p className="text-muted-foreground mt-1">
          {myBooth
            ? `Processing at ${myBooth.name} (${myBooth.boothCode})`
            : "No booth assigned"}
        </p>
      </div>

      {/* No booth warning */}
      {!myBooth && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="p-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              You are not assigned to any booth. Contact an administrator.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search type toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={searchType === "plate" ? "default" : "outline"}
          onClick={() => { setSearchType("plate"); setResult(null); }}
          className="flex-1"
        >
          <Car className="h-4 w-4" strokeWidth={1.75} />
          License Plate
        </Button>
        <Button
          type="button"
          variant={searchType === "rfid" ? "default" : "outline"}
          onClick={() => { setSearchType("rfid"); setResult(null); }}
          className="flex-1"
        >
          <Radio className="h-4 w-4" strokeWidth={1.75} />
          RFID Tag
        </Button>
      </div>

      {/* Process form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {searchType === "plate" ? "Enter License Plate" : "Enter RFID Tag"}
          </CardTitle>
          <CardDescription>
            {searchType === "plate"
              ? "Manually enter the vehicle's license plate number"
              : "Enter or scan the vehicle's RFID tag number"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register("searchType")} value={searchType} />

            {searchType === "plate" ? (
              <div className="space-y-2">
                <Label htmlFor="licensePlate">License Plate *</Label>
                <div className="flex gap-2">
                  <Input
                    id="licensePlate"
                    placeholder="DHA-1234"
                    className="uppercase"
                    {...register("licensePlate")}
                    disabled={!myBooth || isPending}
                  />
                  <Button
                    type="submit"
                    disabled={!myBooth || isPending}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                    ) : (
                      <Search className="h-4 w-4" strokeWidth={1.75} />
                    )}
                    Process
                  </Button>
                </div>
                {errors.licensePlate && (
                  <p className="text-sm text-destructive">
                    {errors.licensePlate.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="rfidTag">RFID Tag *</Label>
                <div className="flex gap-2">
                  <Input
                    id="rfidTag"
                    placeholder="RFID-TMS-000001"
                    {...register("rfidTag")}
                    disabled={!myBooth || isPending}
                  />
                  <Button type="submit" disabled={!myBooth || isPending}>
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                    ) : (
                      <Radio className="h-4 w-4" strokeWidth={1.75} />
                    )}
                    Process
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Result card */}
      {result && (
        <Card
          className={
            result.success
              ? "border-emerald-200 dark:border-emerald-900"
              : "border-red-200 dark:border-red-900"
          }
        >
          <CardContent className="p-5 space-y-4">
            {/* Status header */}
            <div className="flex items-center gap-3">
              {result.success ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" strokeWidth={1.75} />
              ) : (
                <XCircle className="h-6 w-6 text-red-600 shrink-0" strokeWidth={1.75} />
              )}
              <div>
                <p className="font-semibold">
                  {result.success ? "Toll Processed Successfully" : "Transaction Failed"}
                </p>
                {result.transactionRef && (
                  <p className="text-xs text-muted-foreground font-mono">
                    Ref: {result.transactionRef}
                  </p>
                )}
              </div>
            </div>

            {/* Error message */}
            {!result.success && result.errorMessage && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3">
                <p className="text-sm text-red-700 dark:text-red-400">
                  {result.errorMessage}
                </p>
              </div>
            )}

            {/* Success details */}
            {result.success && (
              <>
                <Separator />

                {/* Vehicle info */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Car className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-medium">{result.vehicle?.licensePlate}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {result.vehicle?.vehicleType} • Owner: {result.vehicle?.owner}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Financial breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Toll Amount</span>
                    <span className="font-medium">
                      {formatCurrency(result.amount ?? 0)}
                    </span>
                  </div>

                  {result.discount && result.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">{result.discountReason}</span>
                      <span className="text-emerald-600">
                        -{formatCurrency(result.discount)}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Wallet className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Balance Before
                    </span>
                    <span>{formatCurrency(result.balanceBefore ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span className="flex items-center gap-1">
                      <Wallet className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Balance After
                    </span>
                    <span
                      className={
                        (result.balanceAfter ?? 0) < 200
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }
                    >
                      {formatCurrency(result.balanceAfter ?? 0)}
                    </span>
                  </div>

                  {(result.balanceAfter ?? 0) < 200 && (
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-2">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        ⚠️ Vehicle owner has low balance. They should top up soon.
                      </p>
                    </div>
                  )}
                </div>

                {/* Process another button */}
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => setResult(null)}
                >
                  Process Another Vehicle
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Toll rates reference */}
      {myBooth && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Toll Rates at This Booth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(myBooth.tollRates).map(([type, rate]) => (
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
      )}
    </div>
  );
}