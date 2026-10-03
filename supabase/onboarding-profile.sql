-- LancerMents onboarding: add the columns the wizard writes to.
-- Run once in the Supabase SQL editor. Without these columns the onboarding
-- save silently no-ops (the wizard still redirects to /dashboard).
-- RLS: supabase/setup.sql already grants owners full access to their own profile.

alter table public.profiles
  add column if not exists business_type text,
  add column if not exists plan_type text;
