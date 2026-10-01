-- Sanem shop schema (phase 1) — mirrors Firestore collections.
-- RLS on for every table; no anon/authenticated policies → deny.
-- Service role (Next.js server) bypasses RLS.

create extension if not exists "pgcrypto";

-- Categories
create table public.categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  parent_id text references public.categories (id) on delete set null,
  "order" integer not null default 0,
  is_active boolean not null default true,
  image jsonb,
  seo jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Brands
create table public.brands (
  id text primary key,
  name text not null,
  slug text not null unique,
  logo jsonb,
  description text,
  is_active boolean not null default true,
  seo jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Products
create table public.products (
  id text primary key,
  name text not null,
  slug text not null unique,
  brand_id text references public.brands (id) on delete set null,
  category_ids text[] not null default '{}',
  short_description text not null default '',
  description text not null default '',
  images jsonb not null default '[]',
  options jsonb not null default '[]',
  status text not null check (status in ('draft', 'active', 'archived')),
  is_new boolean not null default false,
  is_best_seller boolean not null default false,
  unit jsonb,
  related_ids text[] not null default '{}',
  search_tokens text[] not null default '{}',
  min_price_cents integer not null default 0 check (min_price_cents >= 0),
  max_price_cents integer not null default 0 check (max_price_cents >= 0),
  total_stock integer not null default 0 check (total_stock >= 0),
  default_variant_id text,
  seo jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_status_idx on public.products (status);
create index products_search_tokens_idx on public.products using gin (search_tokens);
create index products_category_ids_idx on public.products using gin (category_ids);

-- Variants (was products/{id}/variants)
create table public.variants (
  id text not null,
  product_id text not null references public.products (id) on delete cascade,
  sku text not null,
  option_values jsonb not null default '{}',
  price_cents integer not null check (price_cents >= 0),
  compare_at_cents integer check (compare_at_cents is null or compare_at_cents >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_default boolean not null default false,
  image jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_id, id),
  unique (sku)
);

create index variants_product_id_idx on public.variants (product_id);

-- Shop settings (was settings/shop)
create table public.shop_settings (
  id text primary key default 'shop',
  delivery_methods jsonb not null default '[]',
  payment_methods jsonb not null default '[]',
  order_prefix text not null,
  orders_inbox text not null,
  company jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Home content (was content/home)
create table public.home_content (
  id text primary key default 'home',
  hero_slides jsonb not null default '[]',
  promo_blocks jsonb not null default '[]',
  brand_strip_product_ids text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- Discounts (doc id = code)
create table public.discounts (
  code text primary key,
  type text not null check (type in ('percent', 'fixed', 'free_delivery')),
  value integer not null default 0 check (value >= 0),
  min_subtotal_cents integer not null default 0 check (min_subtotal_cents >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order number counter (was counters/orders)
create table public.counters (
  id text primary key,
  seq integer not null default 0 check (seq >= 0)
);

-- Orders
create table public.orders (
  id text primary key default encode(gen_random_bytes(12), 'hex'),
  number text not null unique,
  status text not null,
  payment_status text not null,
  stock_taken boolean not null default false,
  customer jsonb not null,
  delivery jsonb not null,
  billing jsonb,
  billing_same_as_delivery boolean not null default true,
  lines jsonb not null default '[]',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  discount jsonb,
  delivery_method_id text not null,
  delivery_cents integer not null check (delivery_cents >= 0),
  payment_method_id text not null,
  total_cents integer not null check (total_cents >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

-- App users profile / admin flag (uid = auth.users id)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Audit logs
create table public.audit_logs (
  id bigserial primary key,
  actor_uid text,
  action text not null,
  entity text,
  entity_id text,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- RLS: enable, no policies for anon/authenticated (deny). Service role bypasses.
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.variants enable row level security;
alter table public.shop_settings enable row level security;
alter table public.home_content enable row level security;
alter table public.discounts enable row level security;
alter table public.counters enable row level security;
alter table public.orders enable row level security;
alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;

-- Storage bucket for product images (public read; writes via service role)
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'products');
