import Link from "next/link";
import { adminCopy, adminNav } from "@/content/admin";
import { site } from "@/content/site";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out";

type AdminShellProps = {
  email: string | null;
  children: React.ReactNode;
};

export function AdminShell({ email, children }: AdminShellProps) {
  return (
    <div className="flex min-h-dvh bg-surface-2 text-ink">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface">
        <div className="border-b border-border px-4 py-5">
          <p className="font-display text-lg tracking-display">{site.name}</p>
          <p className="text-xs text-ink-muted">{adminCopy.title}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label={adminCopy.title}>
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-h-11 px-3 py-2 text-sm text-ink hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <p className="px-3 text-xs text-ink-muted">{adminCopy.signedInAs}</p>
          <p className="truncate px-3 text-sm font-medium">{email ?? "—"}</p>
          <AdminSignOutButton />
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
