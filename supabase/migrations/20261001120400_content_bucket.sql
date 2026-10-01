-- Public content image bucket (hero / promo)
insert into storage.buckets (id, name, public)
values ('content', 'content', true)
on conflict (id) do nothing;

drop policy if exists "Public read content images" on storage.objects;
create policy "Public read content images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'content');
