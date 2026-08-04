-- Kulture Konnect Network — MVP schema
-- Run this in the Supabase SQL editor (or via `supabase db push` with the CLI).

-- ============================================================
-- Tables
-- ============================================================

create table properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  area text,
  address text,
  distance_from_kk_minutes int,
  description text,
  partner_whatsapp_number text not null, -- E.164 format, e.g. +919876543210
  cover_photo_url text,
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now()
);

create table rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,
  room_type text,
  price numeric(10,2) not null,
  max_guests int not null default 2,
  amenities jsonb not null default '[]',
  photo_urls jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id),
  room_id uuid not null references rooms(id),
  guest_name text not null,
  guest_contact text,
  check_in date not null,
  check_out date not null,
  guests int not null default 1,
  status text not null default 'confirmed' check (status in ('confirmed', 'completed', 'cancelled')),
  whatsapp_sent_at timestamptz,
  whatsapp_message_status text check (whatsapp_message_status in ('sent', 'failed')),
  commission_rate numeric(4,3) not null default 0.30,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint valid_dates check (check_out > check_in)
);

create table room_blocks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  booking_id uuid references bookings(id) on delete set null,
  reason text not null default 'booking' check (reason in ('booking', 'maintenance', 'other')),
  created_at timestamptz not null default now(),
  constraint valid_block_dates check (end_date > start_date)
);

create index idx_rooms_property on rooms(property_id);
create index idx_bookings_property on bookings(property_id);
create index idx_bookings_room on bookings(room_id);
create index idx_room_blocks_room on room_blocks(room_id);
create index idx_room_blocks_dates on room_blocks(room_id, start_date, end_date);

-- ============================================================
-- Row Level Security
-- Properties/rooms/room_blocks are readable by anyone (needed for a future
-- guest-facing view and to check availability). Writes, and all access to
-- bookings (contains guest contact info), require a logged-in staff account.
-- ============================================================

alter table properties enable row level security;
alter table rooms enable row level security;
alter table room_blocks enable row level security;
alter table bookings enable row level security;

create policy "Properties are publicly readable" on properties
  for select using (true);
create policy "Only staff can modify properties" on properties
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Rooms are publicly readable" on rooms
  for select using (true);
create policy "Only staff can modify rooms" on rooms
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Room blocks are publicly readable" on room_blocks
  for select using (true);
create policy "Only staff can modify room blocks" on room_blocks
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Only staff can read bookings" on bookings
  for select using (auth.role() = 'authenticated');
create policy "Only staff can modify bookings" on bookings
  for insert with check (auth.role() = 'authenticated');
create policy "Only staff can update bookings" on bookings
  for update using (auth.role() = 'authenticated');

-- ============================================================
-- Seed data (optional — delete or edit before going live)
-- ============================================================

insert into properties (name, slug, area, address, distance_from_kk_minutes, description, partner_whatsapp_number, status)
values
  ('Sea Breeze Homestay', 'sea-breeze-homestay', 'Varkala', 'Cliff Road, Varkala', 8, 'A quiet two-room homestay run by a local family, five minutes from the cliff.', '+919000000001', 'active'),
  ('Palm Grove Stay', 'palm-grove-stay', 'Varkala', 'Odayam Beach Road, Varkala', 12, 'One premium room set in a coconut grove, a short walk from Odayam beach.', '+919000000002', 'active');

insert into rooms (property_id, name, room_type, price, max_guests, amenities)
select id, 'Sea View Room', 'Double', 1800, 2, '["AC", "Attached bathroom", "Sea view"]'
from properties where slug = 'sea-breeze-homestay';

insert into rooms (property_id, name, room_type, price, max_guests, amenities)
select id, 'Garden Room', 'Double', 1500, 2, '["Fan", "Attached bathroom"]'
from properties where slug = 'sea-breeze-homestay';

insert into rooms (property_id, name, room_type, price, max_guests, amenities)
select id, 'The Grove Room', 'Double', 2200, 3, '["AC", "Attached bathroom", "Private balcony"]'
from properties where slug = 'palm-grove-stay';

-- ============================================================
-- Storage
-- Property cover photos are uploaded by authenticated staff and publicly
-- readable so guest-facing property cards can display them.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Property photos are publicly readable" on storage.objects;
drop policy if exists "Only staff can upload property photos" on storage.objects;
drop policy if exists "Only staff can update property photos" on storage.objects;
drop policy if exists "Only staff can delete property photos" on storage.objects;

create policy "Property photos are publicly readable" on storage.objects
  for select using (bucket_id = 'property-photos');

create policy "Only staff can upload property photos" on storage.objects
  for insert with check (
    bucket_id = 'property-photos'
    and auth.role() = 'authenticated'
  );

create policy "Only staff can update property photos" on storage.objects
  for update using (
    bucket_id = 'property-photos'
    and auth.role() = 'authenticated'
  );

create policy "Only staff can delete property photos" on storage.objects
  for delete using (
    bucket_id = 'property-photos'
    and auth.role() = 'authenticated'
  );
