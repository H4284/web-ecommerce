"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { shopCopy } from "@/content/shop";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { safeNextPath } from "@/lib/shop/auth-path";
import {
  loginFormSchema,
  type LoginFormValues,
} from "@/lib/shop/auth-schema";
import { TurnstileWidget } from "@/components/shop/turnstile-widget";
import { cn } from "cn";

function fieldMessage(code: string | undefined): string {
  if (code === "email") return shopCopy.fieldEmail;
  if (code === "turnstile") return shopCopy.fieldTurnstile;
  return shopCopy.fieldRequired;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"), "/account");
  const [formError, setFormError] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      turnstileToken: "",
      website: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      const supabase = createSupabaseBrowser();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error || !data.session) {
        console.error("[login]", error?.message ?? "no session");
        setFormError(shopCopy.authWrongPassword);
        setTurnstileReset((n) => n + 1);
        return;
      }
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          turnstileToken: values.turnstileToken,
          website: values.website ?? "",
        }),
      });
      if (!res.ok) {
        setFormError(shopCopy.authGenericError);
        setTurnstileReset((n) => n + 1);
        return;
      }
      window.location.assign(next);
    } catch {
      setFormError(shopCopy.authGenericError);
      setTurnstileReset((n) => n + 1);
    }
  }

  return (
    <form
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto flex w-full max-w-md flex-col gap-4"
      noValidate
    >
      {/* Honeypot */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        {...register("website")}
      />

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
            {fieldMessage(errors.email.message)}
          </span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>{shopCopy.authPassword}</span>
        <input
          {...register("password")}
          type="password"
          autoComplete="current-password"
          className={cn(
            "min-h-11 border border-border bg-surface px-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            errors.password && "border-danger",
          )}
        />
        {errors.password ? (
          <span className="text-xs text-danger" role="alert">
            {fieldMessage(errors.password.message)}
          </span>
        ) : null}
      </label>

      <div>
        <TurnstileWidget
          resetSignal={turnstileReset}
          onToken={(token) =>
            setValue("turnstileToken", token, { shouldValidate: true })
          }
          onExpire={() => setValue("turnstileToken", "")}
        />
        {errors.turnstileToken ? (
          <span className="mt-1 block text-xs text-danger" role="alert">
            {fieldMessage(errors.turnstileToken.message)}
          </span>
        ) : null}
      </div>

      {formError ? (
        <p className="text-sm text-danger" role="alert">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 items-center justify-center bg-ink px-5 text-sm font-medium text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
      >
        {isSubmitting ? shopCopy.authLoginSubmitting : shopCopy.authLoginSubmit}
      </button>

      <Link
        href="/forgot-password"
        className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {shopCopy.authForgotLink}
      </Link>
    </form>
  );
}
