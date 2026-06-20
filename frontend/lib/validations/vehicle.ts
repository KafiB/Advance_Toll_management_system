import { z } from "zod";

export const vehicleTypeOptions = [
  { value: "motorcycle", label: "Motorcycle" },
  { value: "car", label: "Car" },
  { value: "suv", label: "SUV" },
  { value: "van", label: "Van" },
  { value: "truck", label: "Truck" },
  { value: "bus", label: "Bus" },
] as const;

export const vehicleSchema = z.object({
  licensePlate: z.string().min(2, "License plate is required").max(15),
  make: z.string().min(1, "Make is required").max(50),
  model: z.string().min(1, "Model is required").max(50),
  year: z.coerce.number()
    .int()
    .min(1900, "Year must be after 1900")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  color: z.string().min(1, "Color is required").max(30),
  vehicleType: z.enum(["motorcycle", "car", "suv", "van", "truck", "bus"], {
    required_error: "Please select a vehicle type",
  }),
  registrationNumber: z.string().min(1, "Registration number is required"),
  registrationExpiry: z.string().min(1, "Registration expiry is required"),
  insuranceNumber: z.string().optional(),
  insuranceExpiry: z.string().optional(),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;