-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase auth)
create table public.profiles (
    id uuid references auth.users on delete cascade,
    username text unique,
    created_at timestamptz default now(),
    primary key (id)
);

-- Cafes
create table public.cafes (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    address text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Reviews
create table public.reviews (
    id uuid default uuid_generate_v4() primary key,
    cafe_id uuid references public.cafes on delete cascade,
    user_id uuid references auth.users on delete cascade,
    content text not null,
    rating numeric(2,1) check (rating >= 0 and rating <= 5),
    created_at timestamptz default now(),
    unique(cafe_id, user_id)  -- One review per cafe per user
);

-- Basic RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.cafes enable row level security;
alter table public.reviews enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
    on public.profiles for select
    using (true);

create policy "Users can insert their own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- Cafes policies
create policy "Cafes are viewable by everyone"
    on public.cafes for select
    using (true);

-- Reviews policies
create policy "Reviews are viewable by everyone"
    on public.reviews for select
    using (true);

create policy "Authenticated users can create reviews"
    on public.reviews for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update own reviews"
    on public.reviews for update
    using (auth.uid() = user_id);
