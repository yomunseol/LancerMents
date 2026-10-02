-- LancerMents MVP — optional setup. Run in the Supabase SQL editor.
-- The tables exist and RLS is enabled, but no policies are defined yet, so a
-- signed-in user sees zero rows. These policies grant owners access to their own
-- data, and the seed gives you 5 tasks + a Basic subscription to operate on.

drop policy if exists "workspaces_owner_all" on public.workspaces;
create policy "workspaces_owner_all" on public.workspaces
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "profiles_owner_all" on public.profiles;
create policy "profiles_owner_all" on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "subscriptions_owner_select" on public.subscriptions;
create policy "subscriptions_owner_select" on public.subscriptions
  for select
  using (auth.uid() = user_id);

drop policy if exists "tasks_workspace_owner_all" on public.tasks;
create policy "tasks_workspace_owner_all" on public.tasks
  for all
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = tasks.workspace_id and w.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workspaces w
      where w.id = tasks.workspace_id and w.owner_id = auth.uid()
    )
  );

drop policy if exists "crm_pipelines_workspace_owner_all" on public.crm_pipelines;
create policy "crm_pipelines_workspace_owner_all" on public.crm_pipelines
  for all
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = crm_pipelines.workspace_id and w.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workspaces w
      where w.id = crm_pipelines.workspace_id and w.owner_id = auth.uid()
    )
  );

drop policy if exists "crm_deals_pipeline_owner_all" on public.crm_deals;
create policy "crm_deals_pipeline_owner_all" on public.crm_deals
  for all
  using (
    exists (
      select 1 from public.crm_pipelines p
      join public.workspaces w on w.id = p.workspace_id
      where p.id = crm_deals.pipeline_id and w.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.crm_pipelines p
      join public.workspaces w on w.id = p.workspace_id
      where p.id = crm_deals.pipeline_id and w.owner_id = auth.uid()
    )
  );

-- Seed: 5 demo tasks + a Basic subscription for the first signed-up user.
do $$
declare
  uid uuid;
  ws_id uuid;
begin
  select id into uid from auth.users order by created_at asc limit 1;
  if uid is null then
    raise notice 'No auth users yet. Sign in once, then re-run this seed.';
    return;
  end if;

  insert into public.subscriptions (user_id, tier, status, current_period_end)
  select uid, 'basic', 'active', now() + interval '30 days'
  where not exists (select 1 from public.subscriptions where user_id = uid);

  select id into ws_id
  from public.workspaces
  where owner_id = uid
  order by created_at asc
  limit 1;

  if ws_id is null then
    insert into public.workspaces (name, slug, owner_id)
    values ('Alpha Ops', 'alpha-ops', uid)
    returning id into ws_id;
  end if;

  if not exists (select 1 from public.tasks where workspace_id = ws_id) then
    insert into public.tasks (workspace_id, title, description, due_date, sort_order)
    values
      (ws_id, 'Recon inbound leads', 'Flag hot accounts from this week''s intake.', current_date, 0),
      (ws_id, 'Draft Q3 targeting brief', 'Summarize ICP shifts for the quarter.', current_date, 1),
      (ws_id, 'Sync with ops', 'Align on deployment windows.', current_date + 1, 2),
      (ws_id, 'Normalize CRM stages', 'Standardize stage names across pipelines.', current_date + 2, 3),
      (ws_id, 'Weekly pipeline review', 'Close stale deals and update values.', current_date + 3, 4);
  end if;
end $$;
