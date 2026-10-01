"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import { shopCopy } from "@/content/shop";
import type { ShopUser } from "@/lib/shop/auth-types";

type AuthMenuProps = {
  user: ShopUser | null;
};

export function AuthMenu({ user }: AuthMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex min-h-11 items-center gap-1 px-2 text-sm text-ink hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <UserRound className="size-4" aria-hidden />
        <span className="hidden sm:inline">{shopCopy.authSignIn}</span>
        <span className="sr-only sm:hidden">{shopCopy.authSignIn}</span>
      </Link>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center gap-1 px-2 text-sm text-ink hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <UserRound className="size-4" aria-hidden />
        <span className="hidden max-w-28 truncate sm:inline">
          {user.email ?? shopCopy.authAccount}
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-40 min-w-44 border border-border bg-surface py-2 shadow-sm"
        >
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block min-h-11 px-4 py-2 text-sm text-ink hover:bg-surface-2 hover:text-accent"
          >
            {shopCopy.authAccount}
          </Link>
          <Link
            href="/account/orders"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block min-h-11 px-4 py-2 text-sm text-ink hover:bg-surface-2 hover:text-accent"
          >
            {shopCopy.authOrders}
          </Link>
          {user.admin ? (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block min-h-11 px-4 py-2 text-sm text-ink hover:bg-surface-2 hover:text-accent"
            >
              {shopCopy.authAdmin}
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="block w-full min-h-11 px-4 py-2 text-left text-sm text-ink hover:bg-surface-2 hover:text-accent"
          >
            {shopCopy.authSignOut}
          </button>
        </div>
      ) : null}
    </div>
  );
}
