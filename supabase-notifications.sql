-- ============================================================
-- Axiom AI — Notifications table
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('market_weekly','portfolio_drift','analysis_ready','upgrade','system')),
  title       text not null,
  message     text not null,
  href        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- Index for fast unread-count queries
create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, read_at)
  where read_at is null;

-- Row-level security
alter table public.notifications enable row level security;

-- Users can only see their own notifications
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Users can mark their own notifications as read
create policy "notifications_update_read_at"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role can insert (used by cron / server routes)
create policy "notifications_insert_service"
  on public.notifications for insert
  with check (true); -- service role bypasses RLS anyway

-- ============================================================
-- Example: create a notification from a server route
-- (use service role client to bypass RLS)
-- ============================================================
-- insert into public.notifications (user_id, type, title, message, href)
-- values (
--   '<user-uuid>',
--   'analysis_ready',
--   'Nouvelle analyse disponible',
--   'Votre analyse IA est prête. Consultez l''allocation recommandée.',
--   '/advisor'
-- );
