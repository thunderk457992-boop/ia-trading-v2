-- Rate limiting: DB-based cooldown columns
-- Works cross-serverless-instances (unlike in-memory Maps).
-- Run in: Supabase Dashboard → SQL Editor → Run

-- Advisor: track last analysis timestamp for cross-instance cooldown
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_analysis_at timestamptz;

-- Chat: track last chat message timestamp for anti-spam
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_chat_at timestamptz;

-- Index for fast single-row lookup by user_id (already PK, but explicit for clarity)
COMMENT ON COLUMN public.profiles.last_analysis_at
  IS 'Timestamp of last advisor analysis — used for DB-based cross-instance rate limiting';

COMMENT ON COLUMN public.profiles.last_chat_at
  IS 'Timestamp of last chat message — used for DB-based cross-instance anti-spam';
