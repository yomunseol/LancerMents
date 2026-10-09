"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
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

/** The four mutually exclusive render states of the page body. */
type ViewState = "loading" | "empty" | "data";

const STATUS_FILTERS: StatusFilter[] = ["all", "active", "blocked"];

const FILTER_KEY: Record<StatusFilter, "all" | "active" | "blocked"> = {
  all: "all",
  active: "active",
  blocked: "blocked",
};

const BORDER = "border-[#E2D8E0] dark:border-[#4A2E46]";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClass =
  "w-full rounded-lg border border-[#E2D8E0] bg-white px-4 py-3 text-sm text-[#151115] placeholder:text-[#151115]/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:border-[#4A2E46] dark:bg-[#221C21] dark:text-[#F8F4F7] dark:placeholder:text-[#F8F4F7]/60 dark:focus:ring-[#D8A8D3]";

const accentButtonClass =
  "inline-flex items-center gap-2 rounded-lg bg-[#85587D] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 dark:bg-[#D8A8D3] dark:text-[#151115]";

const sectionLabelClass = "text-[11px] uppercase tracking-widest opacity-60";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Only statuses the vocabulary actually defines may be looked up. */
function invoiceStatusKey(status: string | null): "status_draft" | "status_sent" | "status_paid" | "status_overdue" {
  if (status === "sent" || status === "paid" || status === "overdue") {
    return `status_${status}` as const;
  }
  return "status_draft";
}

function MagnifierIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 opacity-50"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function StatusPill({ status }: { status: string | null }) {
  const t = useTranslations();
  const value = status === "blocked" ? "blocked" : "active";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        value === "blocked"
          ? "bg-red-500/15 text-red-600 dark:text-red-400"
          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
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
  const [addShown, setAddShown] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [addressWarning, setAddressWarning] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);

  const [confirmBlockId, setConfirmBlockId] = useState<string | null>(null);
  const [drawerClient, setDrawerClient] = useState<Client | null>(null);
  const [drawerShown, setDrawerShown] = useState(false);
  const [drawerNotes, setDrawerNotes] = useState<Note[]>([]);
  const [drawerDeals, setDrawerDeals] = useState<Deal[]>([]);
  const [drawerInvoices, setDrawerInvoices] = useState<Invoice[]>([]);
  const panelRef = useRef<HTMLElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

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
    setNameError(null);
    setEmailError(null);
    setAddressWarning(false);
    setAddOpen(true);
  }

  function closeAdd() {
    setAddOpen(false);
    setNameError(null);
    setEmailError(null);
    setAddressWarning(false);
  }

  useEffect(() => {
    if (!ws?.id) return; // WS-GATE
    setLoading(true);
    load(ws.id).finally(() => setLoading(false));
  }, [ws?.id, load]);

  /**
   * OMEGA-06: callable re-fetch exposed in page scope — the add modal (07) and
   * the follow-up prompts (09) call refresh() after a mutation to reload rows.
   * Deliberately does not flip `loading`, so a mutation never swaps the table
   * for the skeleton.
   */
  const refresh = useCallback(async () => {
    if (!ws?.id) return;
    await load(ws.id);
  }, [ws?.id, load]);

  // Add-modal shell (OMEGA-07): drive the entrance transition from a mount flag
  // and close on Escape. Outside-click close lives on the overlay below.
  useEffect(() => {
    if (!addOpen) {
      setAddShown(false);
      return;
    }
    const frame = requestAnimationFrame(() => setAddShown(true));
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setAddOpen(false);
      setAddressWarning(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [addOpen]);

  // Client-side only: search (name OR email, case-insensitive) + status filter
  // compose in memory. Typing never triggers a server round-trip.
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

    // 1. Validate FIRST — inline field errors, never a banner.
    const nameInvalid = !name;
    const emailInvalid = Boolean(email) && !EMAIL_RE.test(email);
    setNameError(nameInvalid ? "Name is required." : null);
    setEmailError(emailInvalid ? "Enter a valid email address." : null);
    if (nameInvalid || emailInvalid) return;
    if (!workspaceId) return;

    setAddressWarning(false);
    setSaving(true);
    try {
      let lat: number | null = null;
      let lng: number | null = null;

      // 2. Geocode the address when one was supplied (loading: geocoding).
      if (address) {
        setGeocoding(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
          );
          const results = (await response.json()) as { lat: string; lon: string }[];
          const hit = results?.[0];
          if (hit) {
            lat = Number(hit.lat);
            lng = Number(hit.lon);
          } else {
            // Non-blocking: amber inline warning, save without coordinates.
            setAddressWarning(true);
          }
        } catch {
          // Non-blocking: amber inline warning, save without coordinates.
          setAddressWarning(true);
        } finally {
          setGeocoding(false);
        }
      }

      // 3. Build the payload.
      const payload: Record<string, unknown> = {
        workspace_id: workspaceId,
        name,
        email: email || null,
        address: address || null,
      };

      // 4. Only send coordinates when the geocode produced real numbers — never
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

      // 5. Success: close + clear, refresh the page rows, surface the banner.
      await refresh();
      closeAdd();
      setNewName("");
      setNewEmail("");
      setNewAddress("");
      setFb({ kind: "success", label: t("saved") });
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

  // Drawer shell: slide-in transition, Escape + outside-click close, focus the
  // panel on open, keep Tab inside it, and restore focus on close.
  useEffect(() => {
    if (!drawerClient) {
      setDrawerShown(false);
      return;
    }

    const frame = requestAnimationFrame(() => setDrawerShown(true));
    lastFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawerClient(null);
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.getClientRects().length > 0);
      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      const restore = lastFocusRef.current;
      if (restore && restore.isConnected) restore.focus();
    };
  }, [drawerClient]);

  const state: ViewState = loading ? "loading" : clients.length === 0 ? "empty" : "data";
  const busy = saving || geocoding;

  if (loadFailed) {
    // OMEGA-05: a failed load renders the FeedbackBanner and nothing else.
    return (
      <FeedbackBanner
        kind={fb?.kind ?? "error"}
        label={fb?.label ?? t("err_load")}
        raw={fb?.raw}
        onRetry={fb?.onRetry}
      />
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">{t("clients")}</h1>
        <button type="button" onClick={openAdd} className={accentButtonClass}>
          <PlusIcon />
          {t("add_client")}
        </button>
      </div>

      {/* Mutation feedback (OMEGA-05). Orthogonal to the load states below. */}
      {!loading && fb && !addOpen && (
        <div className="mt-6">
          <FeedbackBanner
            kind={fb.kind}
            label={fb.label}
            raw={fb.raw}
            onRetry={fb.onRetry}
          />
        </div>
      )}

      {/* Exactly one of loading / empty / data renders — never two at once. */}
      {state === "loading" && (
        <div className="mt-6 flex flex-col gap-3">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="h-14 animate-pulse rounded-xl bg-[#E2D8E0]/40 dark:bg-[#4A2E46]/40"
            />
          ))}
        </div>
      )}

      {state === "empty" && (
        <div
          className={`mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed p-16 text-center ${BORDER}`}
        >
          <p className="text-base font-bold text-[#151115] dark:text-[#F8F4F7]">
            {t("empty_clients")}
          </p>
          <p className="mt-1 text-sm opacity-60">{t("empty_clients_sub")}</p>
          <button type="button" onClick={openAdd} className={`mt-6 ${accentButtonClass}`}>
            <PlusIcon />
            {t("add_first_client")}
          </button>
        </div>
      )}

      {state === "data" && (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-md flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#151115]/50 dark:text-[#F8F4F7]/50">
                <MagnifierIcon />
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("search")}
                className={`pl-10 ${fieldClass}`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                    filter === option
                      ? "bg-[#85587D] text-white dark:bg-[#D8A8D3] dark:text-[#151115]"
                      : "text-[#151115]/70 hover:bg-[#85587D]/10 dark:text-[#F8F4F7]/70 dark:hover:bg-[#D8A8D3]/10"
                  }`}
                >
                  {t(FILTER_KEY[option])}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title={"No matches."}
                subtitle={"Try a different search or filter."}
              />
            </div>
          ) : (
            <>
              <div className={`mt-6 hidden overflow-hidden rounded-2xl border md:block ${BORDER}`}>
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F8F4F7] uppercase text-[11px] tracking-widest opacity-60 dark:bg-[#151115]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">{t("client_name")}</th>
                      <th className="px-5 py-3 font-semibold">{t("email")}</th>
                      <th className="px-5 py-3 font-semibold">{t("status")}</th>
                      <th className="px-5 py-3 text-right font-semibold">{t("actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((client) => (
                      <tr
                        key={client.id}
                        tabIndex={0}
                        onClick={() => void openDrawer(client)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            void openDrawer(client);
                          }
                        }}
                        className={`cursor-pointer border-b border-[#E2D8E0] transition-all duration-200 hover:bg-[#85587D]/5 dark:border-[#4A2E46] dark:hover:bg-[#D8A8D3]/5 ${
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
                          <div
                            className="flex items-center justify-end gap-2"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => setConfirmBlockId(client.id)}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold text-[#151115] transition-all duration-200 hover:shadow-lg dark:text-[#F8F4F7] ${BORDER}`}
                            >
                              {client.status === "blocked" ? t("unblock") : t("block")}
                            </button>
                            {confirmBlockId === client.id && (
                              <button
                                type="button"
                                onClick={() => void toggleBlock(client)}
                                className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all duration-200 dark:text-red-400"
                              >
                                {t("sure")}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void openDrawer(client)}
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

              <ul className="mt-6 flex flex-col gap-3 md:hidden">
                {visible.map((client) => (
                  <li
                    key={client.id}
                    className={`overflow-hidden rounded-xl border bg-white transition-all duration-200 dark:bg-[#221C21] ${BORDER} ${
                      client.status === "blocked" ? "opacity-70" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => void openDrawer(client)}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors duration-200 hover:bg-[#85587D]/5 dark:hover:bg-[#D8A8D3]/5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-[#151115] dark:text-[#F8F4F7]">
                          {client.name}
                        </span>
                        <span className="block truncate text-xs text-[#151115]/70 dark:text-[#F8F4F7]/70">
                          {client.email ?? "—"}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <StatusPill status={client.status} />
                        <ChevronRightIcon />
                      </span>
                    </button>
                    <div
                      className={`flex items-center gap-2 border-t px-4 py-2 ${BORDER}`}
                    >
                      <button
                        type="button"
                        onClick={() => setConfirmBlockId(client.id)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold text-[#151115] transition-all duration-200 dark:text-[#F8F4F7] ${BORDER}`}
                      >
                        {client.status === "blocked" ? t("unblock") : t("block")}
                      </button>
                      {confirmBlockId === client.id && (
                        <button
                          type="button"
                          onClick={() => void toggleBlock(client)}
                          className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400"
                        >
                          {t("sure")}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          onClick={closeAdd}
        >
          <form
            onSubmit={handleAdd}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t("add_client")}
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all duration-200 ease-out motion-reduce:transition-none ${BORDER} bg-white dark:bg-[#221C21] ${
              addShown ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-[#151115] dark:text-[#F8F4F7]">
                {t("add_client")}
              </h2>
              <button
                type="button"
                onClick={closeAdd}
                aria-label={t("cancel")}
                className={`shrink-0 rounded-lg border p-2 text-[#151115] transition-all duration-200 hover:bg-[#85587D]/10 dark:text-[#F8F4F7] dark:hover:bg-[#D8A8D3]/10 ${BORDER}`}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <input
                  value={newName}
                  onChange={(event) => {
                    setNewName(event.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder={t("client_name")}
                  className={fieldClass}
                />
                {nameError && <p className="text-xs text-red-500">{nameError}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(event) => {
                    setNewEmail(event.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder={t("client_email_optional")}
                  className={fieldClass}
                />
                {emailError && <p className="text-xs text-red-500">{emailError}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <input
                  value={newAddress}
                  onChange={(event) => {
                    setNewAddress(event.target.value);
                    if (addressWarning) setAddressWarning(false);
                  }}
                  placeholder={t("address_optional")}
                  className={fieldClass}
                />
                {geocoding && <p className="text-xs opacity-60">{t("geocoding")}</p>}
                {addressWarning && (
                  <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                    {t("address_not_found")}
                  </div>
                )}
              </div>
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
                onClick={closeAdd}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold text-[#151115] transition-all duration-200 hover:shadow-lg dark:text-[#F8F4F7] ${BORDER}`}
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={busy}
                className={`${accentButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {busy && <Spinner />}
                {t("create")}
              </button>
            </div>
          </form>
        </div>
      )}

      {drawerClient && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[2px]"
          onClick={() => setDrawerClient(null)}
        >
          <aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={drawerClient.name}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
            className={`h-full w-full max-w-md overflow-y-auto border-l border-[#E2D8E0] bg-white p-6 outline-none transition-transform duration-[250ms] ease-out motion-reduce:transition-none dark:border-[#4A2E46] dark:bg-[#221C21] ${
              drawerShown ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-[#151115] dark:text-[#F8F4F7]">
                  {drawerClient.name}
                </h2>
                <div className="mt-2">
                  <StatusPill status={drawerClient.status} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerClient(null)}
                aria-label={t("cancel")}
                className={`shrink-0 rounded-lg border p-2 text-[#151115] transition-all duration-200 hover:bg-[#85587D]/10 dark:text-[#F8F4F7] dark:hover:bg-[#D8A8D3]/10 ${BORDER}`}
              >
                <CloseIcon />
              </button>
            </div>

            <dl className="mt-6 flex flex-col gap-2">
              <div className={`flex items-center justify-between gap-4 rounded-lg border px-3 py-2 ${BORDER}`}>
                <dt className={sectionLabelClass}>{t("email")}</dt>
                <dd className="min-w-0 truncate text-sm text-[#151115] dark:text-[#F8F4F7]">
                  {drawerClient.email ?? "—"}
                </dd>
              </div>
              <div className={`flex items-center justify-between gap-4 rounded-lg border px-3 py-2 ${BORDER}`}>
                <dt className={sectionLabelClass}>{t("location")}</dt>
                <dd className="min-w-0 truncate text-sm text-[#151115] dark:text-[#F8F4F7]">
                  {drawerClient.address ?? "—"}
                </dd>
              </div>
              <div className={`flex items-center justify-between gap-4 rounded-lg border px-3 py-2 ${BORDER}`}>
                <dt className={sectionLabelClass}>{t("saved")}</dt>
                <dd className="text-sm text-[#151115] dark:text-[#F8F4F7]">
                  {formatDate(drawerClient.created_at, locale)}
                </dd>
              </div>
            </dl>

            <section className="mt-6">
              <h3 className={sectionLabelClass}>{t("notes")}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {drawerNotes.length === 0 && (
                  <p className="text-sm opacity-60">{t("no_linked_notes")}</p>
                )}
                {drawerNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/dashboard/notes?note=${note.id}`}
                    className={`rounded-full border px-3 py-1 text-xs font-medium text-[#85587D] transition-all duration-200 hover:border-[#85587D] dark:text-[#D8A8D3] dark:hover:border-[#D8A8D3] ${BORDER}`}
                  >
                    {note.title || "Untitled"}
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-6">
              <h3 className={sectionLabelClass}>{t("deals")}</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {drawerDeals.length === 0 && (
                  <li className="text-sm opacity-60">{t("no_deals_yet")}</li>
                )}
                {drawerDeals.map((deal) => (
                  <li
                    key={deal.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${BORDER}`}
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
              <h3 className={sectionLabelClass}>{t("invoices")}</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {drawerInvoices.length === 0 && (
                  <li className="text-sm opacity-60">{t("no_invoices_yet")}</li>
                )}
                {drawerInvoices.map((invoice) => (
                  <li
                    key={invoice.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${BORDER}`}
                  >
                    <span className="capitalize text-[#151115]/70 dark:text-[#F8F4F7]/70">
                      {t(invoiceStatusKey(invoice.status))}
                    </span>
                    <span className="font-semibold text-[#151115] dark:text-[#F8F4F7]">
                      {formatCurrency(invoice.amount, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-6">
              <h3 className={sectionLabelClass}>{t("location")}</h3>
              {planCanonical === "studio" ? (
                drawerClient.address_lat != null && drawerClient.address_lng != null ? (
                  <div className="mt-2">
                    <div className={`h-48 overflow-hidden rounded-xl border ${BORDER}`}>
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
                className={`flex-1 rounded-lg border px-4 py-2.5 text-center text-sm font-semibold text-[#151115] transition-all duration-200 hover:shadow-lg dark:text-[#F8F4F7] ${BORDER}`}
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
