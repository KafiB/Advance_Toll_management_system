"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { vehiclesApi } from "@/lib/api/vehicles";
import { Vehicle } from "@/lib/api/types";

// ─────────────────────────────────────────────────────
//  use-vehicles.ts
//  React Query hooks for the vehicle module.
// ─────────────────────────────────────────────────────

export const useMyVehicles = () => {
  return useQuery({
    queryKey: ["vehicles", "my-vehicles"],
    queryFn: () => vehiclesApi.getMyVehicles(),
  });
};

export const useVehicle = (id: string | undefined) => {
  return useQuery({
    queryKey: ["vehicles", id],
    queryFn: () => vehiclesApi.getById(id as string),
    enabled: !!id,
  });
};

export const useRegisterVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Vehicle>) => vehiclesApi.register(payload),
    onSuccess: () => {
      toast.success("Vehicle registered successfully");
      queryClient.invalidateQueries({ queryKey: ["vehicles", "my-vehicles"] });
    },
    onError: (error: { message: string }) => {
      toast.error("Registration failed", { description: error.message });
    },
  });
};