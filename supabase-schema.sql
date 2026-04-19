-- IA Trading Sens — Supabase Schema
-- Run this in your Supabase SQL editor

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'premium')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- AI Analyses table
create table public.ai_analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  investor_profile jsonb not null default '{}',
  allocations jsonb not null default '[]',
  total_score integer default 0,
  market_context text,
  recommendations jsonb default '[]',
  warnings jsonb default '[]',
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.ai_analyses enable row level security;

-- Profiles RLS policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- AI Analyses RLS policies
create policy "Users can view own analyses"
  on public.ai_analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.ai_analyses for insert
  with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Indexes
create index on public.ai_analyses (user_id);
create index on public.ai_analyses (created_at desc);
