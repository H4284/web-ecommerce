"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { filterCities } from "@/lib/shop/cities";
import { shopCopy } from "@/content/shop";
import { cn } from "cn";

type CityComboboxProps = {
  value: string;
  onChange: (city: string) => void;
  onBlur?: () => void;
  error?: boolean;
  id?: string;
  name?: string;
};

export function CityCombobox({
  value,
  onChange,
  onBlur,
  error,
  id,
  name,
}: CityComboboxProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const shown = draft ?? value;

  const matches = useMemo(() => filterCities(shown, 12), [shown]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setDraft(null);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(city: string) {
    onChange(city);
    setDraft(null);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        name={name}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="address-level2"
        value={shown}
        placeholder={shopCopy.checkoutCitySearch}
        onChange={(e) => {
          setDraft(e.target.value);
          setOpen(true);
          if (e.target.value !== value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setDraft(null);
          onBlur?.();
        }}
        aria-invalid={error || undefined}
        className={cn(
          "min-h-11 w-full border border-border bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          error && "border-danger",
        )}
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto border border-border bg-surface shadow-md"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-muted">
              {shopCopy.checkoutCityEmpty}
            </li>
          ) : (
            matches.map((city) => (
              <li key={city} role="option" aria-selected={city === value}>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center px-3 text-left text-sm text-ink hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(city)}
                >
                  {city}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
