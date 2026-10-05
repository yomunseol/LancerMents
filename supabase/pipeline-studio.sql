-- LancerMents — PROMPT 4/5 (Pipeline + Studio) prerequisites.
-- Run once in the Supabase SQL editor.
--
-- Verified live schema (probed via PostgREST):
--   clients(id, workspace_id, name, email, status, created_at, address_lat, address_lng)
--   deals(id, workspace_id, client_id, title, value, stage, created_at)
--   invoices(id, workspace_id, client_id, amount, status, due_date, created_at)
--   metrics(id, workspace_id, metric_type, value, created_at)
--   spreadsheets(id, workspace_id, name, data, updated_at)
--   profiles(id, plan_type, business_type, display_name)
--
-- So only two columns are actually missing.

alter table public.clients add column if not exists address text;
alter table public.metrics add column if not exists date date;

-- Workspace-owner RLS for the Pipeline/Studio tables (idempotent).
drop policy if exists "clients_workspace_owner_all" on public.clients;
create policy "clients_workspace_owner_all" on public.clients
  for all
  using (
    exists (select 1 from public.workspaces w
            where w.id = clients.workspace_id and w.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.workspaces w
            where w.id = clients.workspace_id and w.owner_id = auth.uid())
  );

drop policy if exists "deals_workspace_owner_all" on public.deals;
create policy "deals_workspace_owner_all" on public.deals
  for all
  using (
    exists (select 1 from public.workspaces w
            where w.id = deals.workspace_id and w.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.workspaces w
            where w.id = deals.workspace_id and w.owner_id = auth.uid())
  );

drop policy if exists "invoices_workspace_owner_all" on public.invoices;
create policy "invoices_workspace_owner_all" on public.invoices
  for all
  using (
    exists (select 1 from public.workspaces w
            where w.id = invoices.workspace_id and w.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.workspaces w
            where w.id = invoices.workspace_id and w.owner_id = auth.uid())
  );

drop policy if exists "metrics_workspace_owner_all" on public.metrics;
create policy "metrics_workspace_owner_all" on public.metrics
  for all
  using (
    exists (select 1 from public.workspaces w
            where w.id = metrics.workspace_id and w.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.workspaces w
            where w.id = metrics.workspace_id and w.owner_id = auth.uid())
  );

drop policy if exists "spreadsheets_workspace_owner_all" on public.spreadsheets;
create policy "spreadsheets_workspace_owner_all" on public.spreadsheets
  for all
  using (
    exists (select 1 from public.workspaces w
            where w.id = spreadsheets.workspace_id and w.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.workspaces w
            where w.id = spreadsheets.workspace_id and w.owner_id = auth.uid())
  );
