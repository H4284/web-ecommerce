-- Extra order fields used by emails / thank-you / admin timeline
alter table public.orders
  add column if not exists newsletter_opt_in boolean not null default false,
  add column if not exists timeline jsonb not null default '[]',
  add column if not exists emails jsonb not null default '{}';
