"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { shopCopy } from "@/content/shop";
import { auth } from "@/lib/firebase/client";
import { safeNextPath } from "@/lib/shop/auth-path";
import {
  loginFormSchema,
  type LoginFormValues,
} from "@/lib/shop/auth-schema";
import { cn } from "cn";

function fieldMessage(code: string | undefined): string {
  if (code === "email") return shopCopy.fieldEmail;
  return shopCopy.fieldRequired;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"), "/account");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        setFormError(shopCopy.authGenericError);
        return;
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (
        code === "auth/wrong-password" ||
        code === "auth/user-not-found" ||
        code === "auth/invalid-credential" ||
        code === "auth/invalid-login-credentials"
      ) {
        setFormError(shopCopy.authWrongPassword);
      } else {
        setFormError(shopCopy.authGenericError);
      }
    }
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
