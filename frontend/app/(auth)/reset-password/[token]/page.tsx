"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { resetPasswordSchema, ResetPasswordFormValues } from "@/lib/validations/auth";
import { authApi } from "@/lib/api/auth";

interface Props {
  params: Promise<{ token: string }>;
}

export default function ResetPasswordPage({ params }: Props) {
  const { token } = use(params);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: (newPassword: string) =>
      authApi.resetPassword(token, newPassword),
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    },
    onError: (error: { message: string }) => {
      toast.error("Reset failed", { description: error.message });
    },
  });

  const { register, handleSubmit, formState: { errors } } =
    useForm<ResetPasswordFormValues>({
      resolver: zodResolver(resetPasswordSchema),
    });

  const onSubmit = (values: ResetPasswordFormValues) => {
    mutate(values.newPassword);
  };

  if (success) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-xl font-semibold font-heading">Password reset!</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Redirecting you to login...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" strokeWidth={1.75} />
          </div>
        </div>
        <CardTitle className="text-2xl font-semibold font-heading">
          Reset password
        </CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                {...register("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
          <Link href="/login" className="text-sm text-center text-muted-foreground hover:text-foreground">
            Back to Login
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}