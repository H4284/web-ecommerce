"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { shopCopy } from "@/content/shop";
import { auth } from "@/lib/firebase/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/shop/auth-schema";
import { cn } from "cn";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    try {
      await sendPasswordResetEmail(auth, values.email);
      setSent(true);
    } catch {
      // Same message either way — do not reveal whether the email exists.
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <p className="text-sm text-ink">{shopCopy.authForgotSent}</p>
        <Link
          href="/login"
          className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {shopCopy.authForgotBack}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto flex w-full max-w-md flex-col gap-4"
      noValidate
    >
      <label className="flex flex-col gap-1 text-sm">
        <span>{shopCopy.authEmail}</span>
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          className={cn(
            "min-h-11 border border-border bg-surface px-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            errors.email && "border-danger",
          )}
        />
        {errors.email ? (
          <span className="text-xs text-danger" role="alert">
            {shopCopy.fieldEmail}
          </span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 items-center justify-center bg-ink px-5 text-sm font-medium text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
      >
        {isSubmitting
          ? shopCopy.authForgotSubmitting
          : shopCopy.authForgotSubmit}
      </button>

      <Link
        href="/login"
        className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {shopCopy.authForgotBack}
      </Link>
    </form>
  );
}
