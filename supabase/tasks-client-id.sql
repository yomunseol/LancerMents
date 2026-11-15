-- FOUNDER SQL: run manually in the Supabase SQL editor.
-- Do NOT execute from the app. The tasks UI renders a client name only when
-- this reference exists; the frontend query stays unchanged until it does.

alter table public.tasks
  add column if not exists client_id uuid references public.clients(id) on delete set null;

create index if not exists tasks_client_id_idx
  on public.tasks (client_id);
