import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getBrandById,
  getCategoryTree,
  getProductBySlug,
  getRelated,
} from "@/lib/shop/catalog";
import { getShopSettings } from "@/lib/shop/settings";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/shop/json-ld";
import { initialSelectionFromSku, variantTitleSuffix } from "@/lib/shop/variants";
import imageLoader from "@/lib/images/loader";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { ProductDescription } from "@/components/shop/product-description";
import { ProductRelated } from "@/components/shop/product-related";
import { ProductView } from "@/components/shop/product-view";
import { site } from "@/content/site";
import { shopCopy } from "@/content/shop";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
};

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function absoluteImageUrl(path: string) {
  const src = imageLoader({ src: path, width: 1280 });
  if (src.startsWith("http")) return src;
  return `${siteUrl().replace(/\/$/, "")}${src.startsWith("/") ? src : `/${src}`}`;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { variant: variantSku } = await searchParams;
  const product = await getProductBySlug(slug);
  if (!product) {
    return {
      title: { absolute: `${site.chrome.notFoundTitle} | ${site.name}` },
      robots: { index: false },
    };
  }

  const { selection } = initialSelectionFromSku(
    product.variants,
    product.options,
    variantSku,
    product.defaultVariantId,
  );
  const suffix = variantTitleSuffix(product.options, selection);
  const title = suffix
    ? `${product.name} - ${suffix} | ${site.name}`
    : `${product.name} | ${site.name}`;
  const description = product.shortDescription || site.tagline;
  const canonical = `${siteUrl().replace(/\/$/, "")}/products/${product.slug}`;
  const ogImage = product.images[0]
    ? absoluteImageUrl(product.images[0].path)
    : undefined;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage, width: 1280, alt: product.images[0]?.alt }] : [],
    },
  };
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { variant: variantSku } = await searchParams;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [tree, settings, brand, related] = await Promise.all([
    getCategoryTree(),
    getShopSettings(),
    product.brandId ? getBrandById(product.brandId) : Promise.resolve(null),
    getRelated(product, 8),
  ]);

  const brandName = brand?.name ?? null;
  const relatedCards = related
    .filter((item) => item.id !== product.id)
    .map((item) => ({
      product: item,
      brandName,
    }));

  const kosovo = settings.deliveryMethods.find((m) => m.id === "kosovo" && m.active);
  const cod = settings.paymentMethods.find((m) => m.id === "cod" && m.active);

  const categoryLinks: Array<{ name: string; slug: string; parentSlug?: string; parentName?: string }> =
    [];
  for (const id of product.categoryIds) {
    for (const root of tree) {
      if (root.id === id) {
        categoryLinks.push({ name: root.name, slug: root.slug });
      }
      const child = root.children.find((c) => c.id === id);
      if (child) {
        categoryLinks.push({
          name: child.name,
          slug: child.slug,
          parentSlug: root.slug,
          parentName: root.name,
        });
      }
    }
  }

  const primary = categoryLinks[0];
  const crumbItems = [
    { label: shopCopy.breadcrumbHome, href: "/" },
    ...(primary?.parentSlug && primary.parentName
      ? [{ label: primary.parentName, href: `/categories/${primary.parentSlug}` }]
      : []),
    ...(primary
      ? [{ label: primary.name, href: `/categories/${primary.slug}` }]
      : []),
    { label: product.name },
  ];

  const base = siteUrl().replace(/\/$/, "");
  const productPath = `/products/${product.slug}`;
  const ldCrumbs = crumbItems
    .filter((c) => c.href || c.label === product.name)
    .map((c) => ({
      name: c.label,
      path: c.href ?? productPath,
    }));

  const imageUrls = product.images.map((img) => absoluteImageUrl(img.path));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-[var(--space-section)] md:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(ldCrumbs, base)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            productJsonLd({
              name: product.name,
              description: product.shortDescription || site.tagline,
              imageUrls,
              brandName: brand?.name ?? site.name,
              offers: product.variants.map((v) => ({
                sku: v.sku,
                priceCents: v.priceCents,
                stock: v.stock,
                url: `${base}${productPath}?variant=${encodeURIComponent(v.sku)}`,
              })),
            }),
          ),
        }}
      />

      <Breadcrumb items={crumbItems} className="mb-[var(--space-5)]" />

      <ProductView
        product={product}
        variants={product.variants}
        options={product.options}
        brandName={brand?.name ?? null}
        categories={categoryLinks.map((c) => ({ name: c.name, slug: c.slug }))}
        shopName={site.name}
        initialSku={variantSku ?? null}
        delivery={{
          feeCents: kosovo?.priceCents ?? 0,
          freeOverCents: kosovo?.freeOverCents ?? null,
          days: kosovo?.days ?? "",
          codLabel: cod?.label ?? shopCopy.paymentCod,
        }}
      />

      <ProductDescription markdown={product.description} />

      <ProductRelated products={relatedCards} />
    </div>
  );
}
