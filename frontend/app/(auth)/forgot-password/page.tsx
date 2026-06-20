"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, Loader2, ArrowLeft, Mail } from "lucide-react";

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

import { forgotPasswordSchema, ForgotPasswordFormValues } from "@/lib/validations/auth";
import { authApi } from "@/lib/api/auth";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => setEmailSent(true),
    onError: (error: { message: string }) => {
      toast.error("Something went wrong", { description: error.message });
    },
  });

  const { register, handleSubmit, formState: { errors } } =
    useForm<ForgotPasswordFormValues>({
      resolver: zodResolver(forgotPasswordSchema),
    });

  const onSubmit = (values: ForgotPasswordFormValues) => {
    mutate(values.email);
  };

  if (emailSent) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
            <Mail className="h-8 w-8 text-emerald-600" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-xl font-semibold font-heading">Check your email</h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs">
              If an account exists with that email, we sent a password reset link.
              Check your inbox and spam folder.
            </p>
          </div>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
              Back to Login
            </Link>
          </Button>
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
          Forgot password?
        </CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
              Back to Login
            </Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}