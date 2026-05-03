-- ============================================================
-- Axiom AI — Supabase Complete Schema
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ============================================================
-- TABLE 1: profiles
-- Extends auth.users — created automatically via trigger
-- ============================================================
create table if not exists public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  full_name     text,
  avatar_url    text,
  plan          text        not null default 'free'
                            check (plan in ('free', 'pro', 'premium')),
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'User profiles extending auth.users';

-- ============================================================
-- TABLE 2: subscriptions
-- One row per Stripe subscription (source of truth for billing)
-- ============================================================
create table if not exists public.subscriptions (
  id                   text        primary key,  -- Stripe subscription ID (sub_xxx)
  user_id              uuid        not null references public.profiles(id) on delete cascade,
  status               text        not null
                                   check (status in ('active','trialing','past_due','canceled','incomplete','incomplete_expired','unpaid','paused')),
  plan                 text        not null check (plan in ('free','pro','premium')),
  price_id             text,
  quantity             integer     default 1,
  cancel_at_period_end boolean     default false,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancel_at            timestamptz,
  canceled_at          timestamptz,
  trial_start          timestamptz,
  trial_end            timestamptz,
  metadata             jsonb       default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.subscriptions is 'Stripe subscriptions — synced via webhook';
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx  on public.subscriptions(status);

-- ============================================================
-- TABLE 3: payments
-- Every successful Stripe charge / invoice
-- ============================================================
create table if not exists public.payments (
  id               text        primary key,  -- Stripe PaymentIntent or Invoice ID
  user_id          uuid        not null references public.profiles(id) on delete cascade,
  subscription_id  text        references public.subscriptions(id),
  amount           integer     not null,  -- cents
  currency         text        not null default 'eur',
  status           text        not null
                               check (status in ('succeeded','pending','failed','refunded')),
  description      text,
  invoice_url      text,
  receipt_url      text,
  metadata         jsonb       default '{}',
  paid_at          timestamptz,
  created_at       timestamptz not null default now()
);

comment on table public.payments is 'Payment history from Stripe invoices/charges';
create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_created_at_idx on public.payments(created_at desc);

-- ============================================================
-- TABLE 4: strategies (portfolio allocations saved by users)
-- ============================================================
create table if not exists public.strategies (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references public.profiles(id) on delete cascade,
  name             text        not null default 'Ma stratégie',
  description      text,
  risk_level       text        check (risk_level in ('conservative','moderate','aggressive')),
  horizon          text        check (horizon in ('short','medium','long')),
  initial_capital  numeric(15,2),
  monthly_contribution numeric(12,2) default 0,
  goals            text[]      default '{}',
  allocations      jsonb       not null default '[]',
  -- [{ symbol, name, percentage, rationale, risk_level, expected_return, category }]
  is_active        boolean     default true,
  is_favorite      boolean     default false,
  performance_7d   numeric(6,2),  -- % change tracked
  performance_30d  numeric(6,2),
  last_updated_at  timestamptz default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.strategies is 'User-saved crypto portfolio strategies';
create index if not exists strategies_user_id_idx on public.strategies(user_id);
create index if not exists strategies_is_active_idx on public.strategies(user_id, is_active);

-- ============================================================
-- TABLE 5: ai_analyses (each AI advisor session)
-- ============================================================
create table if not exists public.ai_analyses (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references public.profiles(id) on delete cascade,
  strategy_id      uuid        references public.strategies(id) on delete set null,
  investor_profile jsonb       not null default '{}',
  allocations      jsonb       not null default '[]',
  total_score      integer     default 0 check (total_score between 0 and 100),
  market_context   text,
  recommendations  jsonb       default '[]',
  warnings         jsonb       default '[]',
  model_used       text        default 'claude-sonnet-4-6',
  tokens_used      integer,
  created_at       timestamptz not null default now()
);

comment on table public.ai_analyses is 'AI advisor analysis results per session';
create index if not exists ai_analyses_user_id_idx    on public.ai_analyses(user_id);
create index if not exists ai_analyses_created_at_idx on public.ai_analyses(created_at desc);

-- ============================================================
-- TABLE 6: portfolio_history (saved portfolio snapshots)
-- ============================================================
create table if not exists public.portfolio_history (
  id                  uuid         primary key default gen_random_uuid(),
  user_id             uuid         not null references public.profiles(id) on delete cascade,
  analysis_id         uuid         references public.ai_analyses(id) on delete set null,
  portfolio_value     numeric(15,2) not null,
  invested_amount     numeric(15,2),
  performance_percent numeric(8,4),
  allocations         jsonb        not null default '[]',
  created_at          timestamptz  not null default now()
);

comment on table public.portfolio_history is 'Saved portfolio valuation snapshots used by the dashboard performance chart';
create index if not exists portfolio_history_user_id_idx on public.portfolio_history(user_id);
create index if not exists portfolio_history_created_at_idx on public.portfolio_history(user_id, created_at desc);

-- ============================================================
-- TABLE 7: chat_messages (chat usage + optional history)
-- ============================================================
create table if not exists public.chat_messages (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references public.profiles(id) on delete cascade,
  role             text        not null check (role in ('user','assistant')),
  content          text        not null,
  created_at       timestamptz not null default now()
);

comment on table public.chat_messages is 'Chat usage and optional message history';
create index if not exists chat_messages_user_id_idx on public.chat_messages(user_id);
create index if not exists chat_messages_created_at_idx on public.chat_messages(created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments      enable row level security;
alter table public.strategies    enable row level security;
alter table public.ai_analyses   enable row level security;
alter table public.portfolio_history enable row level security;
alter table public.chat_messages enable row level security;

-- profiles: users see and edit only their own row
create policy "profiles: own row read"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles: own row update"
  on public.profiles for update using (auth.uid() = id);

-- subscriptions: read + upsert for user (also writable by service role via webhook)
create policy "subscriptions: own rows read"
  on public.subscriptions for select using (auth.uid() = user_id);
create policy "subscriptions: own rows insert"
  on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "subscriptions: own rows update"
  on public.subscriptions for update using (auth.uid() = user_id);

-- payments: read-only for user (writes via service role)
create policy "payments: own rows read"
  on public.payments for select using (auth.uid() = user_id);

-- strategies: full CRUD by owner
create policy "strategies: own rows read"
  on public.strategies for select using (auth.uid() = user_id);
create policy "strategies: own rows insert"
  on public.strategies for insert with check (auth.uid() = user_id);
create policy "strategies: own rows update"
  on public.strategies for update using (auth.uid() = user_id);
create policy "strategies: own rows delete"
  on public.strategies for delete using (auth.uid() = user_id);

-- ai_analyses: full CRUD by owner
create policy "ai_analyses: own rows read"
  on public.ai_analyses for select using (auth.uid() = user_id);
create policy "ai_analyses: own rows insert"
  on public.ai_analyses for insert with check (auth.uid() = user_id);

-- portfolio_history: read + insert by owner
create policy "portfolio_history: own rows read"
  on public.portfolio_history for select using (auth.uid() = user_id);
create policy "portfolio_history: own rows insert"
  on public.portfolio_history for insert with check (auth.uid() = user_id);

-- chat_messages: read + insert by owner
create policy "chat_messages: own rows read"
  on public.chat_messages for select using (auth.uid() = user_id);
create policy "chat_messages: own rows insert"
  on public.chat_messages for insert with check (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile row when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at on profiles
create or replace function public.set_updated_at()
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
  for each row execute procedure public.set_updated_at();

create trigger strategies_updated_at
  before update on public.strategies
  for each row execute procedure public.set_updated_at();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- HELPER FUNCTION: get active subscription for user
-- ============================================================
create or replace function public.get_active_subscription(p_user_id uuid)
returns table(
  subscription_id text,
  plan text,
  status text,
  current_period_end timestamptz,
  cancel_at_period_end boolean
)
language sql
security definer
as $$
  select id, plan, status, current_period_end, cancel_at_period_end
  from public.subscriptions
  where user_id = p_user_id
    and status in ('active', 'trialing')
  order by created_at desc
  limit 1;
$$;
