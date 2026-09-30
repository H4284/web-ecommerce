"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminCopy } from "@/content/admin";
import type {
  HomeContent,
  HomeHeroSlide,
  HomePromoBlock,
} from "@/lib/shop/home-content-schema";
import {
  saveHomeContentAction,
  uploadHomeHeroImageAction,
} from "@/app/admin/content/actions";

type ContentAdminProps = {
  initial: HomeContent;
  productOptions: Array<{ id: string; name: string }>;
};

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

export function ContentAdmin({ initial, productOptions }: ContentAdminProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [heroSlides, setHeroSlides] = useState(initial.heroSlides);
  const [promoBlocks, setPromoBlocks] = useState(initial.promoBlocks);
  const [brandIdsText, setBrandIdsText] = useState(
    initial.brandStripProductIds.join("\n"),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function payload(): HomeContent {
    return {
      heroSlides,
      promoBlocks,
      brandStripProductIds: brandIdsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
  }

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await saveHomeContentAction(payload());
      if (!result.ok) {
        setError(adminCopy.contentSaveFail);
        return;
      }
      setMessage(adminCopy.contentSaved);
      router.refresh();
    });
  }

  function updateSlide(id: string, patch: Partial<HomeHeroSlide>) {
    setHeroSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }

  function updatePromo(id: string, patch: Partial<HomePromoBlock>) {
    setPromoBlocks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }

  function uploadImage(slideId: string, file: File) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      // Persist current form first so upload reads matching slides.
      await saveHomeContentAction(payload());
      const fd = new FormData();
      fd.set("slideId", slideId);
      fd.set("file", file);
      const result = await uploadHomeHeroImageAction(fd);
      if (!result.ok) {
        setError(adminCopy.contentUploadFail);
        return;
      }
      if (result.content) {
        setHeroSlides(result.content.heroSlides);
      }
      setMessage(adminCopy.contentSaved);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl text-ink">{adminCopy.contentHero}</h2>
          <button
            type="button"
            onClick={() =>
              setHeroSlides((prev) => [
                ...prev,
                {
                  id: newId("slide"),
                  imagePath: null,
                  title: "Slide",
                  subtitle: "",
                  link: "/",
                  order: prev.length,
                  active: true,
                },
              ])
            }
            className="min-h-10 border border-border px-3 text-sm"
          >
            {adminCopy.contentAddSlide}
          </button>
        </div>
        <ul className="space-y-4">
          {heroSlides.map((slide) => (
            <li
              key={slide.id}
              className="grid gap-3 border border-border bg-surface p-4 md:grid-cols-2"
            >
              <label className="flex flex-col gap-1 text-sm">
                <span>{adminCopy.contentSlideTitle}</span>
                <input
                  value={slide.title}
                  onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                  className="min-h-11 border border-border px-3"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>{adminCopy.contentSlideSubtitle}</span>
                <input
                  value={slide.subtitle}
                  onChange={(e) =>
                    updateSlide(slide.id, { subtitle: e.target.value })
                  }
                  className="min-h-11 border border-border px-3"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>{adminCopy.contentSlideLink}</span>
                <input
                  value={slide.link}
                  onChange={(e) => updateSlide(slide.id, { link: e.target.value })}
                  className="min-h-11 border border-border px-3"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>{adminCopy.contentSlideOrder}</span>
                <input
                  type="number"
                  value={slide.order}
                  onChange={(e) =>
                    updateSlide(slide.id, { order: Number(e.target.value) })
                  }
                  className="min-h-11 border border-border px-3"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={slide.active}
                  onChange={(e) =>
                    updateSlide(slide.id, { active: e.target.checked })
                  }
                />
                {adminCopy.contentSlideActive}
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>{adminCopy.contentSlideImage}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={pending}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(slide.id, file);
                  }}
                />
                {slide.imagePath ? (
                  <span className="text-xs text-ink-muted">{slide.imagePath}</span>
                ) : null}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl text-ink">{adminCopy.contentPromo}</h2>
          <button
            type="button"
            onClick={() =>
              setPromoBlocks((prev) => [
                ...prev,
                {
                  id: newId("promo"),
                  title: "Promo",
                  body: "",
                  link: "/",
                  order: prev.length,
                  active: true,
                },
              ])
            }
            className="min-h-10 border border-border px-3 text-sm"
          >
            {adminCopy.contentAddPromo}
          </button>
        </div>
        <ul className="space-y-4">
          {promoBlocks.map((block) => (
            <li
              key={block.id}
              className="grid gap-3 border border-border bg-surface p-4 md:grid-cols-2"
            >
              <label className="flex flex-col gap-1 text-sm">
                <span>{adminCopy.contentPromoTitle}</span>
                <input
                  value={block.title}
                  onChange={(e) => updatePromo(block.id, { title: e.target.value })}
                  className="min-h-11 border border-border px-3"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span>{adminCopy.contentPromoBody}</span>
                <textarea
                  value={block.body}
                  onChange={(e) => updatePromo(block.id, { body: e.target.value })}
                  rows={2}
                  className="border border-border px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>{adminCopy.contentPromoLink}</span>
                <input
                  value={block.link}
                  onChange={(e) => updatePromo(block.id, { link: e.target.value })}
                  className="min-h-11 border border-border px-3"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={block.active}
                  onChange={(e) =>
                    updatePromo(block.id, { active: e.target.checked })
                  }
                />
                {adminCopy.contentSlideActive}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">{adminCopy.contentBrandStrip}</h2>
        <p className="text-xs text-ink-muted">{adminCopy.contentBrandIds}</p>
        <textarea
          value={brandIdsText}
          onChange={(e) => setBrandIdsText(e.target.value)}
          rows={6}
          className="w-full max-w-xl border border-border px-3 py-2 font-mono text-sm"
        />
        {productOptions.length > 0 ? (
          <ul className="max-w-xl text-xs text-ink-muted">
            {productOptions.slice(0, 12).map((p) => (
              <li key={p.id}>
                {p.id} — {p.name}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {message ? (
        <p className="text-sm text-ink-muted" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={pending}
        onClick={save}
        className="min-h-11 w-fit bg-ink px-5 text-sm text-surface disabled:opacity-50"
      >
        {pending ? adminCopy.contentSaving : adminCopy.contentSave}
      </button>
    </div>
  );
}
