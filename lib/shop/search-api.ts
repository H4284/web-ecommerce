export type SearchApiHit = {
  slug: string;
  name: string;
  brandName: string | null;
  priceCents: number;
  image: { path: string; alt: string } | null;
};
