-- ╔══════════════════════════════════════════════════════════════╗
-- ║  5Emojis — Initial Database Schema                         ║
-- ║  Run this in Supabase Dashboard → SQL Editor               ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ─── Extensions ────────────────────────────────────────────────
create extension if not exists postgis with schema extensions;

-- ─── Helper: auto-update updated_at ────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════════
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  dob         date not null,
  race        text,
  religion    text,
  profession  text,
  life_stage  text,
  friendship_style text,
  pronouns    text,
  is_new_to_city boolean not null default false,
  city        text not null,
  state       text,
  zip         text,
  latitude    double precision not null,
  longitude   double precision not null,
  location    extensions.geography(Point, 4326),
  search_radius_miles integer not null default 25,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-compute PostGIS geography column from lat/lng
create or replace function public.profiles_set_location()
returns trigger as $$
begin
  new.location = extensions.st_setsrid(extensions.st_makepoint(new.longitude, new.latitude), 4326)::extensions.geography;
  return new;
end;
$$ language plpgsql;

create trigger profiles_location_trigger
  before insert or update of latitude, longitude on public.profiles
  for each row execute function public.profiles_set_location();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Spatial index for radius search
create index profiles_location_idx on public.profiles using gist (location);
create index profiles_city_idx on public.profiles (city);

-- ═══════════════════════════════════════════════════════════════
-- PROFILE EMOJIS (5 per user)
-- ═══════════════════════════════════════════════════════════════
create table public.profile_emojis (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  emoji     text not null,
  position  smallint not null check (position between 1 and 5),
  unique (user_id, position)
);

create index profile_emojis_user_idx on public.profile_emojis (user_id);

-- ═══════════════════════════════════════════════════════════════
-- PROFILE PHOTOS (up to 5, position 1 = primary)
-- ═══════════════════════════════════════════════════════════════
create table public.profile_photos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  url         text not null,
  position    smallint not null check (position between 1 and 5),
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (user_id, position)
);

create index profile_photos_user_idx on public.profile_photos (user_id);

-- ═══════════════════════════════════════════════════════════════
-- PROFILE INTERESTS (3-5 tags)
-- ═══════════════════════════════════════════════════════════════
create table public.profile_interests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  interest_tag text not null,
  unique (user_id, interest_tag)
);

create index profile_interests_user_idx on public.profile_interests (user_id);

-- ═══════════════════════════════════════════════════════════════
-- PROFILE LANGUAGES
-- ═══════════════════════════════════════════════════════════════
create table public.profile_languages (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  language  text not null,
  unique (user_id, language)
);

create index profile_languages_user_idx on public.profile_languages (user_id);

-- ═══════════════════════════════════════════════════════════════
-- PROFILE REVEALS (4 hidden descriptions, unlocked on match)
-- ═══════════════════════════════════════════════════════════════
create table public.profile_reveals (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  content   text not null,
  position  smallint not null check (position between 1 and 4),
  unique (user_id, position)
);

create index profile_reveals_user_idx on public.profile_reveals (user_id);

-- ═══════════════════════════════════════════════════════════════
-- SWIPES
-- ═══════════════════════════════════════════════════════════════
create table public.swipes (
  id         uuid primary key default gen_random_uuid(),
  swiper_id  uuid not null references public.profiles(id) on delete cascade,
  swiped_id  uuid not null references public.profiles(id) on delete cascade,
  direction  text not null check (direction in ('left', 'right')),
  created_at timestamptz not null default now(),
  unique (swiper_id, swiped_id)
);

create index swipes_swiper_idx on public.swipes (swiper_id);
create index swipes_swiped_idx on public.swipes (swiped_id);
create index swipes_mutual_lookup_idx on public.swipes (swiped_id, swiper_id, direction);

-- ═══════════════════════════════════════════════════════════════
-- MATCHES
-- ═══════════════════════════════════════════════════════════════
create table public.matches (
  id                 uuid primary key default gen_random_uuid(),
  user1_id           uuid not null references public.profiles(id) on delete cascade,
  user2_id           uuid not null references public.profiles(id) on delete cascade,
  emoji_match_count  smallint not null default 0,
  is_emoji_perfect   boolean not null default false,
  created_at         timestamptz not null default now(),
  unique (user1_id, user2_id),
  check (user1_id < user2_id) -- canonical ordering prevents duplicates
);

create index matches_user1_idx on public.matches (user1_id);
create index matches_user2_idx on public.matches (user2_id);

-- ═══════════════════════════════════════════════════════════════
-- MESSAGES
-- ═══════════════════════════════════════════════════════════════
create table public.messages (
  id            uuid primary key default gen_random_uuid(),
  match_id      uuid not null references public.matches(id) on delete cascade,
  sender_id     uuid not null references public.profiles(id) on delete cascade,
  content       text not null,
  is_emoji_only boolean not null default false,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index messages_match_idx on public.messages (match_id, created_at);
create index messages_sender_idx on public.messages (sender_id);

-- ═══════════════════════════════════════════════════════════════
-- BLOCKS
-- ═══════════════════════════════════════════════════════════════
create table public.blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

create index blocks_blocker_idx on public.blocks (blocker_id);
create index blocks_blocked_idx on public.blocks (blocked_id);

-- ═══════════════════════════════════════════════════════════════
-- REPORTS
-- ═══════════════════════════════════════════════════════════════
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason      text not null,
  details     text,
  status      text not null default 'pending' check (status in ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at  timestamptz not null default now()
);

create index reports_status_idx on public.reports (status);

-- ═══════════════════════════════════════════════════════════════
-- AI CONTENT (daily batch from Claude — serves all users)
-- ═══════════════════════════════════════════════════════════════
create table public.ai_content (
  id         uuid primary key default gen_random_uuid(),
  content    jsonb not null,
  created_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Radius search: find profiles within N miles of a point
create or replace function public.nearby_profiles(
  user_lat double precision,
  user_lng double precision,
  radius_miles integer,
  current_user_id uuid
)
returns setof public.profiles as $$
begin
  return query
    select p.*
    from public.profiles p
    where p.id != current_user_id
      -- Within radius
      and extensions.st_dwithin(
        p.location,
        extensions.st_setsrid(extensions.st_makepoint(user_lng, user_lat), 4326)::extensions.geography,
        radius_miles * 1609.34  -- miles to meters
      )
      -- Not blocked by current user
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = current_user_id and b.blocked_id = p.id)
           or (b.blocker_id = p.id and b.blocked_id = current_user_id)
      )
      -- Not already swiped
      and not exists (
        select 1 from public.swipes s
        where s.swiper_id = current_user_id and s.swiped_id = p.id
      )
    order by p.location <-> extensions.st_setsrid(extensions.st_makepoint(user_lng, user_lat), 4326)::extensions.geography;
end;
$$ language plpgsql security definer;

-- Calculate emoji match count between two users
create or replace function public.calc_emoji_match_count(uid1 uuid, uid2 uuid)
returns smallint as $$
  select count(*)::smallint
  from public.profile_emojis e1
  join public.profile_emojis e2
    on e1.emoji = e2.emoji
  where e1.user_id = uid1 and e2.user_id = uid2;
$$ language sql stable;

-- ═══════════════════════════════════════════════════════════════
-- TRIGGER: Auto-create match on mutual right swipe
-- ═══════════════════════════════════════════════════════════════
create or replace function public.handle_new_swipe()
returns trigger as $$
declare
  match_count smallint;
  uid_low uuid;
  uid_high uuid;
begin
  -- Only check for match on right swipes
  if new.direction != 'right' then
    return new;
  end if;

  -- Check if the other person already swiped right on us
  if exists (
    select 1 from public.swipes
    where swiper_id = new.swiped_id
      and swiped_id = new.swiper_id
      and direction = 'right'
  ) then
    -- Canonical ordering: smaller UUID first
    if new.swiper_id < new.swiped_id then
      uid_low := new.swiper_id;
      uid_high := new.swiped_id;
    else
      uid_low := new.swiped_id;
      uid_high := new.swiper_id;
    end if;

    -- Calculate emoji overlap
    match_count := public.calc_emoji_match_count(uid_low, uid_high);

    -- Create match (ignore if already exists)
    insert into public.matches (user1_id, user2_id, emoji_match_count, is_emoji_perfect)
    values (uid_low, uid_high, match_count, match_count = 5)
    on conflict (user1_id, user2_id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_new_swipe
  after insert on public.swipes
  for each row execute function public.handle_new_swipe();

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.profile_emojis enable row level security;
alter table public.profile_photos enable row level security;
alter table public.profile_interests enable row level security;
alter table public.profile_languages enable row level security;
alter table public.profile_reveals enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.ai_content enable row level security;

-- ─── Profiles ──────────────────────────────────────────────────
-- Anyone authenticated can read profiles (for discovery)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can insert their own profile
create policy "Users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Users can update their own profile
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ─── Profile Emojis ───────────────────────────────────────────
create policy "Emojis are viewable by authenticated users"
  on public.profile_emojis for select
  to authenticated
  using (true);

create policy "Users can manage their own emojis"
  on public.profile_emojis for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own emojis"
  on public.profile_emojis for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete their own emojis"
  on public.profile_emojis for delete
  to authenticated
  using (user_id = auth.uid());

-- ─── Profile Photos ───────────────────────────────────────────
create policy "Photos are viewable by authenticated users"
  on public.profile_photos for select
  to authenticated
  using (true);

create policy "Users can manage their own photos"
  on public.profile_photos for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own photos"
  on public.profile_photos for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete their own photos"
  on public.profile_photos for delete
  to authenticated
  using (user_id = auth.uid());

-- ─── Profile Interests ────────────────────────────────────────
create policy "Interests are viewable by authenticated users"
  on public.profile_interests for select
  to authenticated
  using (true);

create policy "Users can manage their own interests"
  on public.profile_interests for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete their own interests"
  on public.profile_interests for delete
  to authenticated
  using (user_id = auth.uid());

-- ─── Profile Languages ────────────────────────────────────────
create policy "Languages are viewable by authenticated users"
  on public.profile_languages for select
  to authenticated
  using (true);

create policy "Users can manage their own languages"
  on public.profile_languages for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete their own languages"
  on public.profile_languages for delete
  to authenticated
  using (user_id = auth.uid());

-- ─── Profile Reveals ──────────────────────────────────────────
-- Reveals are only visible to matched users
create policy "Reveals visible to matched users"
  on public.profile_reveals for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.matches m
      where (m.user1_id = auth.uid() and m.user2_id = user_id)
         or (m.user2_id = auth.uid() and m.user1_id = user_id)
    )
  );

create policy "Users can manage their own reveals"
  on public.profile_reveals for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own reveals"
  on public.profile_reveals for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete their own reveals"
  on public.profile_reveals for delete
  to authenticated
  using (user_id = auth.uid());

-- ─── Swipes ───────────────────────────────────────────────────
create policy "Users can create their own swipes"
  on public.swipes for insert
  to authenticated
  with check (swiper_id = auth.uid());

create policy "Users can read their own swipes"
  on public.swipes for select
  to authenticated
  using (swiper_id = auth.uid());

-- ─── Matches ──────────────────────────────────────────────────
create policy "Users can read their own matches"
  on public.matches for select
  to authenticated
  using (user1_id = auth.uid() or user2_id = auth.uid());

-- ─── Messages ─────────────────────────────────────────────────
create policy "Users can read messages in their matches"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

create policy "Users can send messages in their matches"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

-- Mark messages as read
create policy "Users can update read_at on messages sent to them"
  on public.messages for update
  to authenticated
  using (
    sender_id != auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

-- ─── Blocks ───────────────────────────────────────────────────
create policy "Users can create blocks"
  on public.blocks for insert
  to authenticated
  with check (blocker_id = auth.uid());

create policy "Users can read their own blocks"
  on public.blocks for select
  to authenticated
  using (blocker_id = auth.uid());

create policy "Users can remove their own blocks"
  on public.blocks for delete
  to authenticated
  using (blocker_id = auth.uid());

-- ─── Reports ──────────────────────────────────────────────────
create policy "Users can create reports"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "Users can read their own reports"
  on public.reports for select
  to authenticated
  using (reporter_id = auth.uid());

-- ─── AI Content ───────────────────────────────────────────────
-- All authenticated users can read (it's shared content)
create policy "AI content is readable by all"
  on public.ai_content for select
  to authenticated
  using (true);

-- ═══════════════════════════════════════════════════════════════
-- STORAGE BUCKET for profile photos
-- ═══════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

-- Anyone can view profile photos (public bucket)
create policy "Profile photos are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

-- Users can upload their own photos (folder = their user id)
create policy "Users can upload their own photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own photos
create policy "Users can update their own photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own photos
create policy "Users can delete their own photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════════════════════════════
-- REALTIME — enable for messages (chat) and matches (notifications)
-- ═══════════════════════════════════════════════════════════════
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.matches;
