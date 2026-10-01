-- Admin order fields (notes exists; add bank + rename-friendly columns)
alter table public.orders
  add column if not exists internal_note text not null default '',
  add column if not exists bank_transaction_id text,
  add column if not exists bank_last4 text;

-- Prefer internal_note; keep notes in sync for older rows
update public.orders
set internal_note = coalesce(nullif(internal_note, ''), notes, '')
where coalesce(notes, '') <> '' and coalesce(internal_note, '') = '';
