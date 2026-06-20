"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  UserCog,
  Search,
  Building2,
  Plus,
  Loader2,
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { authApi } from "@/lib/api/auth";
import { useBooths } from "@/lib/hooks/use-booths";
import { Booth, User } from "@/lib/api/types";
import api from "@/lib/api/axios";

// ─────────────────────────────────────────────────────
//  admin/operators/page.tsx
//  Full operator management:
//  - List all operators (from /auth/users?role=operator)
//  - Register new operator
//  - Assign operator to a booth
//  - Delete/deactivate operator
// ─────────────────────────────────────────────────────

const registerOperatorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterOperatorValues = z.infer<typeof registerOperatorSchema>;

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function AdminOperatorsPage() {
  const [search, setSearch] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [selectedBooth, setSelectedBooth] = useState("");
  const queryClient = useQueryClient();

  // ── Fetch all operators ────────────────────────────
  const { data: operatorsRes, isLoading } = useQuery({
    queryKey: ["operators"],
    queryFn: () => authApi.getAllUsers({ role: "operator", limit: 100 }),
  });

  // ── Fetch all booths (for assignment) ─────────────
  const { data: boothsRes } = useBooths();
  const booths = (boothsRes?.data ?? []) as Booth[];

  const operators = (operatorsRes?.data ?? []) as User[];

  // ── Filtered list ──────────────────────────────────
  const filtered = search
    ? operators.filter(
        (op) =>
          op.name.toLowerCase().includes(search.toLowerCase()) ||
          op.email.toLowerCase().includes(search.toLowerCase())
      )
    : operators;

  // ── Find assigned booth for an operator ───────────
  const getOperatorBooth = (operatorId: string) =>
    booths.find((b) => {
      if (!b.assignedOperator) return false;
      const op = b.assignedOperator as User;
      return op._id === operatorId || op.id === operatorId;
    });

  // ── Register operator mutation ────────────────────
  const { mutate: registerOperator, isPending: registering } = useMutation({
    mutationFn: (values: RegisterOperatorValues) =>
      authApi.register({ ...values, role: "operator" }),
    onSuccess: () => {
      toast.success("Operator registered successfully");
      queryClient.invalidateQueries({ queryKey: ["operators"] });
      setRegisterOpen(false);
      form.reset();
    },
    onError: (error: { message: string }) => {
      toast.error("Registration failed", { description: error.message });
    },
  });

  // ── Assign operator to booth mutation ─────────────
  const { mutate: assignToBooth, isPending: assigning } = useMutation({
    mutationFn: async ({
      operatorId,
      boothId,
    }: {
      operatorId: string;
      boothId: string;
    }) => {
      const { data } = await api.put(`/booths/${boothId}/assign-operator`, {
        operatorId,
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Operator assigned to booth successfully");
      queryClient.invalidateQueries({ queryKey: ["booths"] });
      queryClient.invalidateQueries({ queryKey: ["operators"] });
      setAssignOpen(null);
      setSelectedBooth("");
    },
    onError: (error: { message: string }) => {
      toast.error("Assignment failed", { description: error.message });
    },
  });

  // ── Delete/deactivate operator mutation ───────────
  const { mutate: deleteOperator, isPending: deleting } = useMutation({
    mutationFn: (id: string) => authApi.deleteUser(id),
    onSuccess: () => {
      toast.success("Operator deactivated successfully");
      queryClient.invalidateQueries({ queryKey: ["operators"] });
    },
    onError: (error: { message: string }) => {
      toast.error("Failed to deactivate operator", {
        description: error.message,
      });
    },
  });

  // ── Register form ──────────────────────────────────
  const form = useForm<RegisterOperatorValues>({
    resolver: zodResolver(registerOperatorSchema),
    defaultValues: { name: "", email: "", phone: "", password: "" },
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-heading tracking-tight">
            Operators
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage booth operators and their assignments
          </p>
        </div>

        {/* Register operator dialog */}
        <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              Register Operator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Operator</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit((v) => registerOperator(v))}
              className="space-y-4 mt-2"
            >
              <div className="space-y-2">
                <Label htmlFor="reg-name">Full Name *</Label>
                <Input
                  id="reg-name"
                  placeholder="Ahmed Farid"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email">Email *</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="operator@tollsystem.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-phone">Phone *</Label>
                <Input
                  id="reg-phone"
                  placeholder="+8801700000000"
                  {...form.register("phone")}
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password">Password *</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Min 8 characters"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={registering}
              >
                {registering ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      strokeWidth={1.75}
                    />
                    Registering...
                  </>
                ) : (
                  "Register Operator"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          strokeWidth={1.75}
        />
        <Input
          placeholder="Search by name or email..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Operators table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" strokeWidth={1.75} />
            All Operators
          </CardTitle>
          <CardDescription>
            {filtered.length} operator{filtered.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <UserCog
                  className="h-6 w-6 text-muted-foreground"
                  strokeWidth={1.75}
                />
              </div>
              <div>
                <p className="font-medium">No operators found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Register your first operator to assign them to a booth.
                </p>
              </div>
              <Button size="sm" onClick={() => setRegisterOpen(true)}>
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                Register Operator
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operator</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Assigned Booth</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((operator) => {
                  const operatorId = operator._id ?? operator.id ?? "";
                  const assignedBooth = getOperatorBooth(operatorId);

                  return (
                    <TableRow key={operatorId}>
                      {/* Operator info */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-500/10 text-blue-600 text-xs font-medium">
                              {getInitials(operator.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {operator.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {operator.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="text-sm text-muted-foreground">
                        {operator.phone ?? "—"}
                      </TableCell>

                      {/* Assigned booth */}
                      <TableCell>
                        {assignedBooth ? (
                          <div className="flex items-center gap-2">
                            <Building2
                              className="h-4 w-4 text-muted-foreground shrink-0"
                              strokeWidth={1.75}
                            />
                            <div>
                              <p className="text-sm font-medium">
                                {assignedBooth.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {assignedBooth.boothCode}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-amber-600">
                            Not assigned
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant={
                            operator.isActive ? "secondary" : "destructive"
                          }
                        >
                          {operator.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Assign booth dialog */}
                          <Dialog
                            open={assignOpen === operatorId}
                            onOpenChange={(open) => {
                              if (!open) {
                                setAssignOpen(null);
                                setSelectedBooth("");
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAssignOpen(operatorId)}
                              >
                                {assignedBooth ? "Reassign" : "Assign Booth"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Assign {operator.name} to a Booth
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 mt-2">
                                <div className="space-y-2">
                                  <Label>Select Booth *</Label>
                                  <Select
                                    value={selectedBooth}
                                    onValueChange={setSelectedBooth}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose a booth" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {booths
                                        .filter((b) => b.isActive)
                                        .map((b) => (
                                          <SelectItem key={b._id} value={b._id}>
                                            {b.name} ({b.boothCode})
                                            {typeof b.assignedOperator ===
                                              "object" &&
                                              b.assignedOperator && (
                                                <span className="text-muted-foreground">
                                                  {" "}
                                                  — assigned
                                                </span>
                                              )}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <Button
                                  className="w-full"
                                  disabled={!selectedBooth || assigning}
                                  onClick={() =>
                                    assignToBooth({
                                      operatorId,
                                      boothId: selectedBooth,
                                    })
                                  }
                                >
                                  {assigning ? (
                                    <>
                                      <Loader2
                                        className="h-4 w-4 animate-spin"
                                        strokeWidth={1.75}
                                      />
                                      Assigning...
                                    </>
                                  ) : (
                                    "Confirm Assignment"
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Delete operator */}
                          {operator.isActive && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2
                                    className="h-4 w-4"
                                    strokeWidth={1.75}
                                  />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Deactivate Operator
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will deactivate{" "}
                                    <strong>{operator.name}</strong>&apos;s
                                    account. They will no longer be able to log
                                    in or process tolls.
                                    {assignedBooth && (
                                      <span className="block mt-2 text-amber-600">
                                        ⚠️ This operator is currently assigned
                                        to {assignedBooth.name}.
                                      </span>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteOperator(operatorId)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {deleting ? (
                                      <Loader2
                                        className="h-4 w-4 animate-spin"
                                        strokeWidth={1.75}
                                      />
                                    ) : (
                                      "Deactivate"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}