"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/format";
import EmptyState from "@/app/components/EmptyState";
import TierGate from "@/app/components/TierGate";
import { useWorkspace } from "../WorkspaceContext";

type Client = {
  id: string;
  workspace_id: string;
  name: string;
  email: string | null;
  status: string | null;
  created_at: string;
};

type Note = { id: string; title: string | null };
type Deal = { id: string; title: string; value: number | null; stage: string | null };
type Invoice = { id: string; amount: number | null; status: string | null };

type StatusFilter = "all" | "active" | "blocked";

const fieldClass =
  "w-full rounded-lg border border-[#E2D8E0] bg-white px-4 py-3 text-sm text-[#151115] placeholder:text-[#151115]/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:border-[#4A2E46] dark:bg-[#221C21] dark:text-[#F8F4F7] dark:placeholder:text-[#F8F4F7]/60 dark:focus:ring-[#D8A8D3]";

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function StatusPill({ status }: { status: string | null }) {
  const blocked = status === "blocked";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        blocked
          ? "bg-red-500/15 text-red-600 dark:text-red-400"
          : "bg-green-500/15 text-green-600 dark:text-green-400"
      }`}
    >
      {blocked ? "Blocked" : "Active"}
    </span>
  );
}

function ClientsInner() {
  const { activeWorkspace, loading: workspaceLoading } = useWorkspace();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmBlockId, setConfirmBlockId] = useState<string | null>(null);
  const [drawerClient, setDrawerClient] = useState<Client | null>(null);
  const [drawerNotes, setDrawerNotes] = useState<Note[]>([]);
  const [drawerDeals, setDrawerDeals] = useState<Deal[]>([]);
  const [drawerInvoices, setDrawerInvoices] = useState<Invoice[]>([]);

  const workspaceId = activeWorkspace?.id ?? "";

  const load = useCallback(async (id: string) => {
    setError(null);
    try {
      const { data, error: loadError } = await supabase
        .from("clients")
        .select("id,workspace_id,name,email,status,created_at")
        .eq("workspace_id", id)
        .order("created_at", { ascending: false });
      if (loadError) throw loadError;
      setClients((data ?? []) as Client[]);
    } catch (loadError) {
      setError(messageOf(loadError, "Could not load clients."));
    }
  }, []);

  useEffect(() => {
    if (workspaceLoading) return;
    if (!workspaceId) {
      setClients([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    load(workspaceId).finally(() => setLoading(false));
  }, [workspaceId, workspaceLoading, load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return clients.filter((client) => {
      const blocked = client.status === "blocked";
      if (filter === "active" && blocked) return false;
      if (filter === "blocked" && !blocked) return false;
      if (!term) return true;
      return (
        client.name.toLowerCase().includes(term) ||
        (client.email ?? "").toLowerCase().includes(term)
      );
    });
  }, [clients, search, filter]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const name = newName.trim();
    const email = newEmail.trim();

    if (!name) {
      setFormError("Name is required.");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (!workspaceId) return;

    setSaving(true);
    try {
      const { error: insertError } = await supabase
        .from("clients")
        .insert({ workspace_id: workspaceId, name, email: email || null, status: "active" });
      if (insertError) throw insertError;
      await load(workspaceId);
      setAddOpen(false);
      setNewName("");
      setNewEmail("");
    } catch (insertError) {
      setFormError(messageOf(insertError, "Could not add the client."));
    } finally {
      setSaving(false);
    }
  }

  async function toggleBlock(client: Client) {
    setError(null);
    setConfirmBlockId(null);
    const next = client.status === "blocked" ? "active" : "blocked";
    setClients((current) =>
      current.map((item) => (item.id === client.id ? { ...item, status: next } : item)),
    );
    try {
      const { error: updateError } = await supabase
        .from("clients")
        .update({ status: next })
        .eq("id", client.id);
      if (updateError) throw updateError;
    } catch (updateError) {
      setClients((current) =>
        current.map((item) =>
          item.id === client.id ? { ...item, status: client.status } : item,
        ),
      );
      setError(messageOf(updateError, "Could not update the client."));
    }
  }

  async function openDrawer(client: Client) {
    setDrawerClient(client);
    setDrawerNotes([]);
    setDrawerDeals([]);
    setDrawerInvoices([]);
    try {
      const [notes, deals, invoices] = await Promise.all([
        supabase.from("notes").select("id,title").eq("linked_client_id", client.id).limit(20),
        supabase.from("deals").select("id,title,value,stage").eq("client_id", client.id).limit(20),
        supabase.from("invoices").select("id,amount,status").eq("client_id", client.id).limit(20),
      ]);
      setDrawerNotes((notes.data ?? []) as Note[]);
      setDrawerDeals((deals.data ?? []) as Deal[]);
      setDrawerInvoices((invoices.data ?? []) as Invoice[]);
    } catch {
      /* drawer simply shows what it has */
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">Clients</h1>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="rounded-lg bg-[#85587D] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]"
        >
          Add Client
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email…"
          className={`sm:max-w-xs ${fieldClass}`}
        />
        <div className="flex items-center gap-2">
          {(["all", "active", "blocked"] as StatusFilter[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200 ${
                filter === option
                  ? "bg-[#85587D] text-white dark:bg-[#D8A8D3] dark:text-[#151115]"
                  : "border border-[#E2D8E0] text-[#151115]/70 hover:border-[#85587D] dark:border-[#4A2E46] dark:text-[#F8F4F7]/70 dark:hover:border-[#D8A8D3]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((row) => (
              <div
                key={row}
                className="h-14 animate-pulse rounded-xl bg-[#E2D8E0]/50 dark:bg-[#4A2E46]/40"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            title={clients.length === 0 ? "No clients yet." : "No matches."}
            subtitle={
              clients.length === 0
                ? "Your first client is one click away."
                : "Try a different search or filter."
            }
            actionLabel={clients.length === 0 ? "Add your first client" : undefined}
            onAction={clients.length === 0 ? () => setAddOpen(true) : undefined}
          />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-[#E2D8E0] md:block dark:border-[#4A2E46]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8F4F7] text-xs uppercase tracking-widest opacity-60 dark:bg-[#151115]">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((client) => (
                    <tr
                      key={client.id}
                      className={`border-t border-[#E2D8E0] transition-all duration-200 dark:border-[#4A2E46] ${
                        client.status === "blocked" ? "opacity-70" : ""
                      }`}
                    >
                      <td className="px-5 py-3 font-medium text-[#151115] dark:text-[#F8F4F7]">
                        {client.name}
                      </td>
                      <td className="px-5 py-3 text-[#151115]/70 dark:text-[#F8F4F7]/70">
                        {client.email ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={client.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmBlockId(client.id)}
                            className="rounded-lg border border-[#E2D8E0] px-3 py-1.5 text-xs font-semibold text-[#151115] transition-all duration-200 hover:shadow-lg dark:border-[#4A2E46] dark:text-[#F8F4F7]"
                          >
                            {client.status === "blocked" ? "Unblock" : "Block"}
                          </button>
                          {confirmBlockId === client.id && (
                            <button
                              type="button"
                              onClick={() => toggleBlock(client)}
                              className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all duration-200 dark:text-red-400"
                            >
                              Sure?
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openDrawer(client)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#85587D] transition-all duration-200 hover:bg-[#85587D]/10 dark:text-[#D8A8D3] dark:hover:bg-[#D8A8D3]/10"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="flex flex-col gap-3 md:hidden">
              {visible.map((client) => (
                <li
                  key={client.id}
                  className={`rounded-xl border border-[#E2D8E0] bg-white p-4 transition-all duration-200 dark:border-[#4A2E46] dark:bg-[#221C21] ${
                    client.status === "blocked" ? "border-red-500/40 opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-[#151115] dark:text-[#F8F4F7]">
                        {client.name}
                      </p>
                      <p className="truncate text-xs text-[#151115]/70 dark:text-[#F8F4F7]/70">
                        {client.email ?? "—"}
                      </p>
                    </div>
                    <StatusPill status={client.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmBlockId(client.id)}
                      className="rounded-lg border border-[#E2D8E0] px-3 py-1.5 text-xs font-semibold text-[#151115] transition-all duration-200 dark:border-[#4A2E46] dark:text-[#F8F4F7]"
                    >
                      {client.status === "blocked" ? "Unblock" : "Block"}
                    </button>
                    {confirmBlockId === client.id && (
                      <button
                        type="button"
                        onClick={() => toggleBlock(client)}
                        className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400"
                      >
                        Sure?
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openDrawer(client)}
                      className="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold text-[#85587D] dark:text-[#D8A8D3]"
                    >
                      View
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setAddOpen(false)}
        >
          <form
            onSubmit={handleAdd}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-[#E2D8E0] bg-white p-6 dark:border-[#4A2E46] dark:bg-[#221C21]"
          >
            <h2 className="text-lg font-semibold text-[#151115] dark:text-[#F8F4F7]">
              Add Client
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Client name"
                className={fieldClass}
              />
              <input
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="Client email (optional)"
                className={fieldClass}
              />
            </div>
            {formError && <p className="mt-3 text-sm text-red-400">{formError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-lg border border-[#E2D8E0] px-4 py-2 text-sm font-semibold text-[#151115] transition-all duration-200 dark:border-[#4A2E46] dark:text-[#F8F4F7]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#85587D] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 dark:bg-[#D8A8D3] dark:text-[#151115]"
              >
                {saving ? "Saving…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {drawerClient && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setDrawerClient(null)}>
          <aside
            onClick={(event) => event.stopPropagation()}
            className="h-full w-full max-w-md overflow-y-auto border-l border-[#E2D8E0] bg-white p-6 transition-transform duration-200 dark:border-[#4A2E46] dark:bg-[#221C21]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#151115] dark:text-[#F8F4F7]">
                  {drawerClient.name}
                </h2>
                <p className="mt-1 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
                  {drawerClient.email ?? "No email"}
                </p>
              </div>
              <StatusPill status={drawerClient.status} />
            </div>

            <section className="mt-6">
              <h3 className="text-xs uppercase tracking-widest opacity-60">Notes</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {drawerNotes.length === 0 && (
                  <p className="text-sm opacity-60">No linked notes.</p>
                )}
                {drawerNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/dashboard/notes?note=${note.id}`}
                    className="rounded-full border border-[#E2D8E0] px-3 py-1 text-xs font-medium text-[#85587D] transition-all duration-200 hover:border-[#85587D] dark:border-[#4A2E46] dark:text-[#D8A8D3] dark:hover:border-[#D8A8D3]"
                  >
                    {note.title || "Untitled"}
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-6">
              <h3 className="text-xs uppercase tracking-widest opacity-60">Deals</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {drawerDeals.length === 0 && (
                  <li className="text-sm opacity-60">No deals yet.</li>
                )}
                {drawerDeals.map((deal) => (
                  <li
                    key={deal.id}
                    className="flex items-center justify-between rounded-lg border border-[#E2D8E0] px-3 py-2 text-sm dark:border-[#4A2E46]"
                  >
                    <span className="text-[#151115] dark:text-[#F8F4F7]">{deal.title}</span>
                    <span className="font-semibold text-[#85587D] dark:text-[#D8A8D3]">
                      {formatCurrency(deal.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-6">
              <h3 className="text-xs uppercase tracking-widest opacity-60">Invoices</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {drawerInvoices.length === 0 && (
                  <li className="text-sm opacity-60">No invoices yet.</li>
                )}
                {drawerInvoices.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="flex items-center justify-between rounded-lg border border-[#E2D8E0] px-3 py-2 text-sm dark:border-[#4A2E46]"
                  >
                    <span className="capitalize text-[#151115]/70 dark:text-[#F8F4F7]/70">
                      {invoice.status ?? "draft"}
                    </span>
                    <span className="font-semibold text-[#151115] dark:text-[#F8F4F7]">
                      {formatCurrency(invoice.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-8 flex gap-2">
              <Link
                href={`/dashboard/crm?client=${drawerClient.id}`}
                className="flex-1 rounded-lg bg-[#85587D] px-4 py-2.5 text-center text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]"
              >
                New Deal
              </Link>
              <Link
                href={`/dashboard/invoices?client=${drawerClient.id}`}
                className="flex-1 rounded-lg border border-[#E2D8E0] px-4 py-2.5 text-center text-sm font-semibold text-[#151115] transition-all duration-200 hover:shadow-lg dark:border-[#4A2E46] dark:text-[#F8F4F7]"
              >
                New Invoice
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export default function ClientsPage() {
  return (
    <TierGate requiredTier="pipeline">
      <ClientsInner />
    </TierGate>
  );
}
