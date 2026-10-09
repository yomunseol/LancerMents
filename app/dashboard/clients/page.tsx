"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/format";
import EmptyState from "@/app/components/EmptyState";
import FeedbackBanner, {
  rawReason,
  type FeedbackState,
} from "@/app/components/FeedbackBanner";
import TierGate from "@/app/components/TierGate";
import { useWorkspaceGate } from "../useWorkspaceData";
import { useProfile } from "../ProfileContext";

const ClientMap = dynamic(() => import("@/app/components/ClientMap"), {
  ssr: false,
});

type Client = {
  id: string;
  workspace_id: string;
  name: string;
  email: string | null;
  status: string | null;
  created_at: string;
  address: string | null;
  address_lat: number | null;
  address_lng: number | null;
};

type Note = { id: string; title: string | null };
type Deal = { id: string; title: string; value: number | null; stage: string | null };
type Invoice = { id: string; amount: number | null; status: string | null };

type StatusFilter = "all" | "active" | "blocked";

const fieldClass =
  "w-full rounded-lg border border-[#E2D8E0] bg-white px-4 py-3 text-sm text-[#151115] placeholder:text-[#151115]/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:border-[#4A2E46] dark:bg-[#221C21] dark:text-[#F8F4F7] dark:placeholder:text-[#F8F4F7]/60 dark:focus:ring-[#D8A8D3]";

function StatusPill({ status }: { status: string | null }) {
  const t = useTranslations();
  const value = status === "blocked" ? "blocked" : "active";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        value === "blocked"
          ? "bg-red-500/15 text-red-600 dark:text-red-400"
          : "bg-green-500/15 text-green-600 dark:text-green-400"
      }`}
    >
      {t("status_" + value)}
    </span>
  );
}

function ClientsInner() {
  const t = useTranslations();
  const locale = useLocale();
  const ws = useWorkspaceGate();
  const { planCanonical } = useProfile();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [fb, setFb] = useState<FeedbackState>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const [confirmBlockId, setConfirmBlockId] = useState<string | null>(null);
  const [drawerClient, setDrawerClient] = useState<Client | null>(null);
  const [drawerNotes, setDrawerNotes] = useState<Note[]>([]);
  const [drawerDeals, setDrawerDeals] = useState<Deal[]>([]);
  const [drawerInvoices, setDrawerInvoices] = useState<Invoice[]>([]);

  const workspaceId = ws?.id ?? "";

  const load = useCallback(
    async (id: string) => {
      setFb(null);
      try {
        const { data, error: loadError } = await supabase
          .from("clients")
          .select("id,name,email,status,address,address_lat,address_lng,created_at")
          .eq("workspace_id", id)
          .order("created_at", { ascending: false });
        if (loadError) throw loadError;
        setClients((data ?? []) as Client[]);
        setLoadFailed(false);
      } catch (loadError) {
        setLoadFailed(true);
        setFb({
          kind: "error",
          label: t("err_load"),
          raw: rawReason(loadError),
          onRetry: () => retryLoad(id),
        });
      }
    },
    [t],
  );

  function retryLoad(id: string) {
    setLoading(true);
    load(id).finally(() => setLoading(false));
  }

  function openAdd() {
    setFb(null);
    setAddOpen(true);
  }

  useEffect(() => {
    if (!ws?.id) return; // WS-GATE
    setLoading(true);
    load(ws.id).finally(() => setLoading(false));
  }, [ws?.id, load]);

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
    await submitNewClient();
  }

  async function submitNewClient() {
    setFb(null);
    const name = newName.trim();
    const email = newEmail.trim();
    const address = newAddress.trim();

    if (!name) {
      setFb({ kind: "error", label: "Name is required." });
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFb({ kind: "error", label: "Enter a valid email address." });
      return;
    }
    if (!workspaceId) return;

    setSaving(true);
    try {
      let lat: number | null = null;
      let lng: number | null = null;
      let warning: string | null = null;

      if (address) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
          );
          const results = (await response.json()) as { lat: string; lon: string }[];
          if (results?.[0]) {
            lat = Number(results[0].lat);
            lng = Number(results[0].lon);
          } else {
            warning = "Address not found — client saved without map.";
          }
        } catch {
          warning = "Address lookup failed — client saved without map.";
        }
      }

      const payload: Record<string, unknown> = {
        workspace_id: workspaceId,
        name,
        email: email || null,
      };

      // Only send coordinates when the geocode produced real numbers — never
      // "", NaN, or a null-string.
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        payload.address_lat = lat;
        payload.address_lng = lng;
      }

      const { error: insertError } = await supabase.from("clients").insert(payload);

      if (insertError) {
        setFb({
          kind: "error",
          label: t("err_add_client"),
          raw: rawReason(insertError),
          onRetry: () => void submitNewClient(),
        });
        return;
      }

      await load(workspaceId);
      setAddOpen(false);
      setNewName("");
      setNewEmail("");
      setNewAddress("");
      // The geocode warning, when present, rides along as the secondary detail line.
      setFb({ kind: "success", label: t("saved"), raw: warning ?? undefined });
    } catch (insertError) {
      setFb({
        kind: "error",
        label: t("err_add_client"),
        raw: rawReason(insertError),
        onRetry: () => void submitNewClient(),
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleBlock(client: Client) {
    setFb(null);
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
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: rawReason(updateError),
      });
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

  if (loadFailed && fb) {
    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
            {t("clients")}
          </h1>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-[#85587D] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]"
          >
            {t("add_client")}
          </button>
        </div>

        <div className="mt-8">
          <FeedbackBanner
            kind={fb.kind}
            label={fb.label}
            raw={fb.raw}
            onRetry={fb.onRetry}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">{t("clients")}</h1>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-[#85587D] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]"
        >
          {t("add_client")}
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("search")}
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
              {t(option)}
            </button>
          ))}
        </div>
      </div>

      {!addOpen && fb && (
        <div className="mt-6">
          <FeedbackBanner
            kind={fb.kind}
            label={fb.label}
            raw={fb.raw}
            onRetry={fb.onRetry}
          />
        </div>
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
            title={clients.length === 0 ? t("empty_clients") : "No matches."}
            subtitle={
              clients.length === 0 ? t("empty_clients_sub") : "Try a different search or filter."
            }
            actionLabel={clients.length === 0 ? t("add_first_client") : undefined}
            onAction={clients.length === 0 ? openAdd : undefined}
          />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-[#E2D8E0] md:block dark:border-[#4A2E46]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8F4F7] text-xs uppercase tracking-widest opacity-60 dark:bg-[#151115]">
                  <tr>
                    <th className="px-5 py-3">{t("client_name")}</th>
                    <th className="px-5 py-3">{t("email")}</th>
                    <th className="px-5 py-3">{t("status")}</th>
                    <th className="px-5 py-3 text-right">{t("actions")}</th>
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
                            {client.status === "blocked" ? t("unblock") : t("block")}
                          </button>
                          {confirmBlockId === client.id && (
                            <button
                              type="button"
                              onClick={() => toggleBlock(client)}
                              className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all duration-200 dark:text-red-400"
                            >
                              {t("sure")}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openDrawer(client)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#85587D] transition-all duration-200 hover:bg-[#85587D]/10 dark:text-[#D8A8D3] dark:hover:bg-[#D8A8D3]/10"
                          >
                            {t("view")}
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
                      {client.status === "blocked" ? t("unblock") : t("block")}
                    </button>
                    {confirmBlockId === client.id && (
                      <button
                        type="button"
                        onClick={() => toggleBlock(client)}
                        className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400"
                      >
                        {t("sure")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openDrawer(client)}
                      className="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold text-[#85587D] dark:text-[#D8A8D3]"
                    >
                      {t("view")}
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
              {t("add_client")}
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder={t("client_name")}
                className={fieldClass}
              />
              <input
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder={t("client_email_optional")}
                className={fieldClass}
              />
              <input
                value={newAddress}
                onChange={(event) => setNewAddress(event.target.value)}
                placeholder={t("address_optional")}
                className={fieldClass}
              />
            </div>
            {fb && (
              <div className="mt-3">
                <FeedbackBanner
                  kind={fb.kind}
                  label={fb.label}
                  raw={fb.raw}
                  onRetry={fb.onRetry}
                />
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-lg border border-[#E2D8E0] px-4 py-2 text-sm font-semibold text-[#151115] transition-all duration-200 dark:border-[#4A2E46] dark:text-[#F8F4F7]"
              >
                {t("cancel")}
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
              <h3 className="text-xs uppercase tracking-widest opacity-60">{t("notes")}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {drawerNotes.length === 0 && (
                  <p className="text-sm opacity-60">{t("no_linked_notes")}</p>
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
              <h3 className="text-xs uppercase tracking-widest opacity-60">{t("deals")}</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {drawerDeals.length === 0 && (
                  <li className="text-sm opacity-60">{t("no_deals_yet")}</li>
                )}
                {drawerDeals.map((deal) => (
                  <li
                    key={deal.id}
                    className="flex items-center justify-between rounded-lg border border-[#E2D8E0] px-3 py-2 text-sm dark:border-[#4A2E46]"
                  >
                    <span className="text-[#151115] dark:text-[#F8F4F7]">{deal.title}</span>
                    <span className="font-semibold text-[#85587D] dark:text-[#D8A8D3]">
                      {formatCurrency(deal.value, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-6">
              <h3 className="text-xs uppercase tracking-widest opacity-60">{t("invoices")}</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {drawerInvoices.length === 0 && (
                  <li className="text-sm opacity-60">{t("no_invoices_yet")}</li>
                )}
                {drawerInvoices.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="flex items-center justify-between rounded-lg border border-[#E2D8E0] px-3 py-2 text-sm dark:border-[#4A2E46]"
                  >
                    <span className="capitalize text-[#151115]/70 dark:text-[#F8F4F7]/70">
                      {t(`status_${invoice.status ?? "draft"}`)}
                    </span>
                    <span className="font-semibold text-[#151115] dark:text-[#F8F4F7]">
                      {formatCurrency(invoice.amount, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-6">
              <h3 className="text-xs uppercase tracking-widest opacity-60">{t("location")}</h3>
              {planCanonical === "studio" ? (
                drawerClient.address_lat != null && drawerClient.address_lng != null ? (
                  <div className="mt-2">
                    <div className="h-48 overflow-hidden rounded-xl border border-[#E2D8E0] dark:border-[#4A2E46]">
                      <ClientMap
                        lat={drawerClient.address_lat}
                        lng={drawerClient.address_lng}
                        label={drawerClient.name}
                      />
                    </div>
                    {drawerClient.address && (
                      <p className="mt-2 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
                        {drawerClient.address}
                      </p>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${drawerClient.address_lat},${drawerClient.address_lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-[#85587D] hover:underline dark:text-[#D8A8D3]"
                    >
                      {t("open_in_maps")}
                    </a>
                  </div>
                ) : (
                  <p className="mt-2 text-sm opacity-60">{t("no_address")}</p>
                )
              ) : (
                <div className="mt-2">
                  <TierGate requiredTier="studio" featureKey="clients" compact />
                </div>
              )}
            </section>

            <div className="mt-8 flex gap-2">
              <Link
                href={`/dashboard/crm?client=${drawerClient.id}`}
                className="flex-1 rounded-lg bg-[#85587D] px-4 py-2.5 text-center text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]"
              >
                {t("new_deal")}
              </Link>
              <Link
                href={`/dashboard/invoices?client=${drawerClient.id}`}
                className="flex-1 rounded-lg border border-[#E2D8E0] px-4 py-2.5 text-center text-sm font-semibold text-[#151115] transition-all duration-200 hover:shadow-lg dark:border-[#4A2E46] dark:text-[#F8F4F7]"
              >
                {t("new_invoice")}
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
    <TierGate requiredTier="pipeline" featureKey="clients">
      <ClientsInner />
    </TierGate>
  );
}
