import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-[var(--space-section)] md:px-6">
      <Skeleton className="mb-6 h-4 w-40 rounded-sm" />
      <Skeleton className="mb-8 h-10 w-56 rounded-sm md:w-72" />
      <div className="mb-8 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-24 rounded-sm" />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/5] w-full rounded-sm" />
            <Skeleton className="h-3 w-16 rounded-sm" />
            <Skeleton className="h-5 w-3/4 rounded-sm" />
            <Skeleton className="h-4 w-20 rounded-sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}
