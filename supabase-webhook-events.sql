-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: webhook_events
-- Run in Supabase SQL editor (service role required)
-- Purpose: idempotency + observability for Stripe webhook processing
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id               TEXT        PRIMARY KEY,       -- Stripe event ID (evt_...)
  type             TEXT        NOT NULL,           -- Stripe event type
  status           TEXT        NOT NULL DEFAULT 'processed',
    -- 'processed' | 'failed' | 'skipped' | 'no_user'
  user_id          UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  stripe_customer  TEXT,
  stripe_object_id TEXT,                          -- sub ID, invoice ID, session ID
  plan             TEXT,
  error_message    TEXT,
  processed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata         JSONB       NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS webhook_events_type_idx         ON public.webhook_events(type);
CREATE INDEX IF NOT EXISTS webhook_events_processed_at_idx ON public.webhook_events(processed_at DESC);
CREATE INDEX IF NOT EXISTS webhook_events_status_idx       ON public.webhook_events(status);
CREATE INDEX IF NOT EXISTS webhook_events_user_id_idx      ON public.webhook_events(user_id);

-- RLS: service role only — users cannot read webhook internals
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- No RLS policies intentionally — only the service role key bypasses RLS
-- (service role bypasses all RLS regardless of policies)
