"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import CrmKanban from "@/components/crm-kanban";
import SignInForm from "@/components/sign-in-form";
import TaskList from "@/components/task-list";
import UpgradeModal from "@/components/upgrade-modal";
import WorkspaceSwitcher from "@/components/workspace-switcher";
import { supabase } from "@/lib/supabase";
import { limitsForTier, normalizeTier, tierLabel } from "@/lib/tiers";
import type { CrmDeal, CrmPipeline, Subscription, Task, Workspace } from "@/lib/types";

type Phase = "loading" | "signed-out" | "ready";
type Tab = "tasks" | "crm";

function tabClass(active: boolean): string {
  return [
    "border-b-2 px-1 py-2 text-sm",
    active
      ? "border-accent-mauve font-semibold text-accent-mauve"
      : "border-transparent font-medium text-primary-text/70 hover:text-primary-text",
  ].join(" ");
}

export default function Dashboard() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [tab, setTab] = useState<Tab>("tasks");
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tier = normalizeTier(subscription?.tier);
  const limits = limitsForTier(tier);
  const isPremium = limits.crm;
  const createDisabled =
    tier === "basic" && workspaces.length >= limits.maxWorkspaces;

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setPhase("signed-out");
      return;
    }

    let mounted = true;
    client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setPhase(data.session ? "ready" : "signed-out");
    });

    const { data: listener } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setPhase(next ? "ready" : "signed-out");
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadWorkspaces = useCallback(async (userId: string) => {
    const client = supabase;
    if (!client) return;

    const [workspaceResult, subscriptionResult] = await Promise.all([
      client
        .from("workspaces")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: true }),
      client
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (workspaceResult.error) setError(workspaceResult.error.message);
    const rows = (workspaceResult.data ?? []) as Workspace[];
    setWorkspaces(rows);
    setSubscription((subscriptionResult.data as Subscription | null) ?? null);
    setActiveWorkspaceId((current) =>
      current && rows.some((workspace) => workspace.id === current)
        ? current
        : rows[0]?.id ?? null,
    );
  }, []);

  useEffect(() => {
    if (session?.user.id) {
      loadWorkspaces(session.user.id);
    } else {
      setWorkspaces([]);
      setSubscription(null);
      setActiveWorkspaceId(null);
    }
  }, [session?.user.id, loadWorkspaces]);

  const loadTasks = useCallback(async (workspaceId: string) => {
    const client = supabase;
    if (!client) return;

    const { data, error: tasksError } = await client
      .from("tasks")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });

    if (tasksError) setError(tasksError.message);
    setTasks((data ?? []) as Task[]);
  }, []);

  useEffect(() => {
    if (activeWorkspaceId) loadTasks(activeWorkspaceId);
    else setTasks([]);
  }, [activeWorkspaceId, loadTasks]);

  const loadCrm = useCallback(async (workspaceId: string) => {
    const client = supabase;
    if (!client) return;

    const { data: pipelineData, error: pipelineError } = await client
      .from("crm_pipelines")
      .select("*")
      .eq("workspace_id", workspaceId);

    if (pipelineError) setError(pipelineError.message);
    const pipelineRows = (pipelineData ?? []) as CrmPipeline[];
    setPipelines(pipelineRows);

    const pipelineIds = pipelineRows.map((pipeline) => pipeline.id);
    if (pipelineIds.length === 0) {
      setDeals([]);
      return;
    }

    const { data: dealData, error: dealError } = await client
      .from("crm_deals")
      .select("*")
      .in("pipeline_id", pipelineIds)
      .order("created_at", { ascending: true });

    if (dealError) setError(dealError.message);
    setDeals((dealData ?? []) as CrmDeal[]);
  }, []);

  useEffect(() => {
    if (tab === "crm" && isPremium && activeWorkspaceId) {
      loadCrm(activeWorkspaceId);
    }
  }, [tab, isPremium, activeWorkspaceId, loadCrm]);

  async function handleAddTask(title: string) {
    const client = supabase;
    if (!client || !activeWorkspaceId) return;

    setBusy(true);
    setError(null);

    const { data, error: insertError } = await client
      .from("tasks")
      .insert({ workspace_id: activeWorkspaceId, title, sort_order: tasks.length })
      .select()
      .single();

    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setTasks((current) => [...current, data as Task]);
  }

  async function handleCreateWorkspace() {
    const client = supabase;
    if (!client || !session) return;

    setBusy(true);
    setError(null);
    const name = `Workspace ${workspaces.length + 1}`;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data, error: insertError } = await client
      .from("workspaces")
      .insert({ name, slug, owner_id: session.user.id })
      .select()
      .single();

    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    const created = data as Workspace;
    setWorkspaces((current) => [...current, created]);
    setActiveWorkspaceId(created.id);
  }

  async function handleSignOut() {
    await supabase?.auth.signOut();
  }

  if (!supabase) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <p className="rounded-lg border border-deep-border bg-surface p-6 text-primary-text">
          Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.
        </p>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <p className="px-6 py-16 text-center text-primary-text/70">
        Loading workspace…
      </p>
    );
  }

  if (phase === "signed-out") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-16">
        <h1 className="text-center text-3xl font-bold tracking-tight text-primary-text">
          Sign in to <span className="text-accent-mauve">LancerMents</span>
        </h1>
        <SignInForm redirectPath="/dashboard" />
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-deep-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
          <span className="text-lg font-bold text-primary-text">
            <span className="text-accent-mauve">Lancer</span>Ments
          </span>
          <WorkspaceSwitcher
            workspaces={workspaces}
            activeId={activeWorkspaceId}
            onSelect={setActiveWorkspaceId}
            createDisabled={createDisabled}
            onCreate={handleCreateWorkspace}
            busy={busy}
          />
          <div className="ml-auto flex items-center gap-3">
            <span className="rounded-full border border-deep-border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-mauve">
              {tierLabel(tier)}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm font-medium text-primary-text/70 transition-colors hover:text-primary-text"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        {error && (
          <p className="mb-4 rounded-md border border-deep-border bg-surface px-4 py-3 text-sm text-accent-mauve">
            {error}
          </p>
        )}

        <div className="flex gap-2 border-b border-deep-border">
          <button
            type="button"
            aria-pressed={tab === "tasks"}
            onClick={() => setTab("tasks")}
            className={tabClass(tab === "tasks")}
          >
            Tasks
          </button>
          <button
            type="button"
            aria-pressed={tab === "crm"}
            onClick={() => setTab("crm")}
            className={tabClass(tab === "crm")}
          >
            CRM
            {!isPremium && (
              <span className="ml-2 rounded-full border border-deep-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-mauve">
                Premium
              </span>
            )}
          </button>
        </div>

        <div className="mt-5">
          {tab === "tasks" ? (
            activeWorkspaceId ? (
              <TaskList
                tasks={tasks}
                limit={limits.maxTasks}
                tierName={tierLabel(tier)}
                onAdd={handleAddTask}
                onRequestUpgrade={() => setModalOpen(true)}
                busy={busy}
              />
            ) : (
              <section className="rounded-lg border border-deep-border bg-surface p-8 text-center">
                <h2 className="text-xl font-semibold text-primary-text">
                  No workspaces yet
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-primary-text/70">
                  Create your first workspace to start configuring tasks.
                </p>
                <button
                  type="button"
                  onClick={handleCreateWorkspace}
                  disabled={busy}
                  className="mt-5 rounded-md bg-accent-mauve px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Create Workspace
                </button>
              </section>
            )
          ) : isPremium ? (
            <CrmKanban pipelines={pipelines} deals={deals} />
          ) : (
            <section className="rounded-lg border border-deep-border bg-surface p-8 text-center">
              <h2 className="text-xl font-semibold text-primary-text">
                CRM is part of The Pipeline
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-primary-text/70">
                Unlimited tasks, pipelines, and deals for $19/mo.
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-5 rounded-md bg-accent-mauve px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Upgrade to The Pipeline
              </button>
            </section>
          )}
        </div>
      </main>

      <UpgradeModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
