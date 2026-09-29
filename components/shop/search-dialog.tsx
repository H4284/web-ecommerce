"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Search } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { formatCents } from "@/lib/shop/money";
import { site } from "@/content/site";
import { shopCopy } from "@/content/shop";
import type { SearchApiHit } from "@/lib/shop/search-api";

const DEBOUNCE_MS = 250;

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchApiHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = (await res.json()) as { results?: SearchApiHit[]; error?: string };
      if (!res.ok) {
        setResults([]);
        setError(data.error ?? "Search failed");
        return;
      }
      setResults(data.results ?? []);
    } catch {
      setResults([]);
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchResults(query);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, fetchResults]);

  function goToFullResults() {
    const q = query.trim();
    if (q.length < 2) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function openProduct(slug: string) {
    setOpen(false);
    router.push(`/products/${slug}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex size-11 items-center justify-center text-ink transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={`${site.chrome.search} (${site.chrome.searchShortcut})`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Search className="size-5" aria-hidden />
      </button>

      <CommandDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setQuery("");
            setResults([]);
            setError(null);
          }
        }}
        title={site.chrome.search}
        description={shopCopy.searchPlaceholder}
        className="sm:max-w-lg"
      >
        <Command shouldFilter={false} className="rounded-none bg-surface">
          <CommandInput
            id={titleId}
            value={query}
            onValueChange={setQuery}
            placeholder={shopCopy.searchPlaceholder}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                goToFullResults();
              }
            }}
          />
          <CommandList>
            {query.trim().length < 2 ? (
              <p className="px-3 py-6 text-center text-sm text-ink-muted">
                {shopCopy.searchHint}
              </p>
            ) : null}
            {query.trim().length >= 2 && !loading && results.length === 0 ? (
              <CommandEmpty>{error ?? shopCopy.searchEmpty}</CommandEmpty>
            ) : null}
            {results.length > 0 ? (
              <CommandGroup heading={site.chrome.search}>
                {results.map((hit) => (
                  <CommandItem
                    key={hit.slug}
                    value={hit.slug}
                    onSelect={() => openProduct(hit.slug)}
                    className="gap-3 py-2"
                  >
                    <span className="relative size-10 shrink-0 overflow-hidden bg-surface-2">
                      {hit.image ? (
                        <Image
                          src={hit.image.path}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      {hit.brandName ? (
                        <span className="text-xs text-ink-muted uppercase">
                          {hit.brandName}
                        </span>
                      ) : null}
                      <span className="truncate font-medium text-ink">{hit.name}</span>
                    </span>
                    <span className="shrink-0 text-sm text-ink-muted">
                      {shopCopy.fromPrice} {formatCents(hit.priceCents)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {loading ? (
              <p className="px-3 py-4 text-center text-sm text-ink-muted">…</p>
            ) : null}
          </CommandList>
          {query.trim().length >= 2 ? (
            <div className="border-t border-border px-3 py-2">
              <button
                type="button"
                className="w-full text-left text-sm text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                onClick={goToFullResults}
              >
                {site.chrome.search}: “{query.trim()}” →
              </button>
            </div>
          ) : null}
        </Command>
      </CommandDialog>
    </>
  );
}
