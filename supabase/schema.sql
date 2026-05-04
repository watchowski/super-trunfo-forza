create extension if not exists pgcrypto;

create table if not exists public.rooms (
  code text primary key,
  state_json jsonb not null,
  host_session_id text not null,
  guest_session_id text,
  host_last_seen_at timestamptz not null default now(),
  guest_last_seen_at timestamptz,
  expires_at timestamptz not null default (now() + interval '6 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rooms_expires_at_idx on public.rooms (expires_at);
create index if not exists rooms_updated_at_idx on public.rooms (updated_at desc);

create table if not exists public.catalog_cards (
  id text primary key,
  normalized_name text not null,
  name text not null,
  manufacturer text not null,
  year integer not null,
  country text,
  image_path text not null,
  image_url text not null,
  source_game text not null,
  car_page_url text not null,
  image_source_url text not null,
  stats_sp numeric not null,
  stats_ha numeric not null,
  stats_ac numeric not null,
  stats_ls numeric not null,
  stats_br numeric not null,
  pl_class text not null,
  pl_pi integer not null,
  pl_label text not null,
  is_super_trunfo boolean not null default false,
  raw_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists catalog_cards_normalized_name_idx on public.catalog_cards (normalized_name, source_game);

alter table public.rooms enable row level security;
alter table public.catalog_cards enable row level security;

drop policy if exists "public can read rooms" on public.rooms;
create policy "public can read rooms"
on public.rooms
for select
to anon, authenticated
using (true);

drop policy if exists "public can read catalog cards" on public.catalog_cards;
create policy "public can read catalog cards"
on public.catalog_cards
for select
to anon, authenticated
using (true);

alter publication supabase_realtime add table public.rooms;

insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', true)
on conflict (id) do nothing;

drop policy if exists "public can read card images" on storage.objects;
create policy "public can read card images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'card-images');
