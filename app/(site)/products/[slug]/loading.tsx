import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-[var(--space-section)] md:px-6">
      <Skeleton className="mb-6 h-4 w-48 rounded-sm" />
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-[4/5] w-full rounded-sm" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-20 rounded-sm" />
          <Skeleton className="h-10 w-2/3 rounded-sm" />
          <Skeleton className="h-4 w-full rounded-sm" />
          <Skeleton className="h-6 w-28 rounded-sm" />
          <Skeleton className="h-11 w-40 rounded-sm" />
          <Skeleton className="h-24 w-full rounded-sm" />
        </div>
      </div>
    </div>
  );
}
