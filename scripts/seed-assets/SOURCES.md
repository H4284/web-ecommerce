# Seed product image sources

Royalty-free / free-to-use photos for local seed and Supabase Storage.
Product names, prices, and catalog fields are unchanged — only image pixels.

## Licenses

- [Unsplash License](https://unsplash.com/license) — free commercial use; no permission needed for the photo itself; do not imply endorsement by the photographer or Unsplash.
- [Pexels License](https://www.pexels.com/license/) — free commercial use; similar attribution guidance.

Do **not** replace these with scraped ecommerce product shots.

## Files

`scripts/seed-assets/products/prod-NN/{0,1}.jpg` — hero (0) and secondary (1) frames.
Seed resizes to WebP at 320 / 640 / 960 / 1280 and uploads to the Supabase `products` bucket.
