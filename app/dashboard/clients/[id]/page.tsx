"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/format";
import FeedbackBanner, {
  rawReason,
  type FeedbackState,
} from "@/app/components/FeedbackBanner";
import { useWorkspaceGate } from "../../useWorkspaceData";

function MapLoading() {
  const t = useTranslations();
  return <p className="p-4 text-sm opacity-60">{t("loading")}</p>;
}

const ClientMap = dynamic(() => import("@/app/components/ClientMap"), {
  ssr: false,
  loading: MapLoading,
});

type Client = {
  id: string;
  workspace_id: string;
  name: string;
  email: string | null;
  status: string | null;
  address: string | null;
  address_lat: number | null;
  address_lng: number | null;
  created_at: string;
};

type Note = { id: string; title: string | null };
type Deal = { id: string; title: string; value: number | null; stage: string | null };
type Invoice = { id: string; amount: number | null; status: string | null };

const BORDER = "border-[#E2D8E0] dark:border-[#4A2E46]";
const CARD = `rounded-2xl border bg-white p-6 dark:bg-[#221C21] ${BORDER}`;
const sectionLabelClass = "text-[11px] uppercase tracking-widest opacity-60";

function invoiceStatusKey(
  status: string | null,
): "status_draft" | "status_sent" | "status_paid" | "status_overdue" {
  if (status === "sent" || status === "paid" || status === "overdue") {
    return `status_${status}` as const;
  }
  return "status_draft";
}

function StatusPill({ status }: { status: string | null }) {
  const t = useTranslations();
  const value = status === "blocked" ? "blocked" : "active";
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest ${
        value === "blocked"
          ? "border-red-500/40 text-red-600 dark:text-red-400"
          : "border-[#85587D]/40 text-[#85587D] dark:border-[#D8A8D3]/40 dark:text-[#D8A8D3]"
      }`}
    >
      {t(`status_${value}`)}
    </span>
  );
}

export default function ClientDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const ws = useWorkspaceGate();
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId ?? "";

  const [client, setClient] = useState<Client | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [fb, setFb] = useState<FeedbackState>(null);

  const load = useCallback(
    async (clientId: string, workspaceId: string) => {
      setFb(null);
      setLoading(true);
      try {
        const { data, error: loadError } = await supabase
          .from("clients")
          .select(
            "id,workspace_id,name,email,status,address,address_lat,address_lng,created_at",
          )
          .eq("id", clientId)
          .eq("workspace_id", workspaceId)
          .maybeSingle();

        if (loadError) throw loadError;

        const row = (data as Client | null) ?? null;
        setClient(row);

        if (row) {
          const [notesResult, dealsResult, invoicesResult] = await Promise.all([
            supabase
              .from("notes")
              .select("id,title")
              .eq("linked_client_id", clientId)
              .limit(20),
            supabase
              .from("deals")
              .select("id,title,value,stage")
              .eq("client_id", clientId)
              .limit(20),
            supabase
              .from("invoices")
              .select("id,amount,status")
              .eq("client_id", clientId)
              .limit(20),
          ]);
          setNotes((notesResult.data ?? []) as Note[]);
          setDeals((dealsResult.data ?? []) as Deal[]);
          setInvoices((invoicesResult.data ?? []) as Invoice[]);
        }
      } catch (loadError) {
        setFb({
          kind: "error",
          label: t("err_load"),
          raw: rawReason(loadError),
          onRetry: () => {
            void load(clientId, workspaceId);
          },
        });
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (!ws?.id || !id) return; // WS-GATE
    void load(id, ws.id);
  }, [ws?.id, id, load]);

  if (loading || !ws) {
    return (
      <div className="h-40 animate-pulse rounded-2xl border border-[#E2D8E0] bg-[#E2D8E0]/40 dark:border-[#4A2E46] dark:bg-[#4A2E46]/30" />
    );
  }

  if (!client) {
    if (fb) {
      return (
        <FeedbackBanner
          kind={fb.kind}
          label={fb.label}
          raw={fb.raw}
          onRetry={fb.onRetry}
        />
      );
    }
    return (
      <div className="mt-8">
        <p className="text-sm opacity-60">{t("empty_clients")}</p>
        <Link
          href="/dashboard/clients"
          className="mt-4 inline-block text-sm font-semibold text-[#85587D] hover:underline dark:text-[#D8A8D3]"
        >
          {t("back")}
        </Link>
      </div>
    );
  }

  const hasCoords =
    typeof client.address_lat === "number" &&
    Number.isFinite(client.address_lat) &&
    typeof client.address_lng === "number" &&
    Number.isFinite(client.address_lng);

  return (
    <>
      <Link
        href="/dashboard/clients"
        className="text-sm font-semibold text-[#85587D] transition-colors duration-200 hover:underline dark:text-[#D8A8D3]"
      >
        {t("back")}
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={sectionLabelClass}>{t("client_detail_title")}</p>
          <h1 className="mt-1 text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
            {client.name}
          </h1>
        </div>
        <StatusPill status={client.status} />
      </div>

      {fb && (
        <div className="mt-6">
          <FeedbackBanner
            kind={fb.kind}
            label={fb.label}
            raw={fb.raw}
            onRetry={fb.onRetry}
          />
        </div>
      )}

      <section className={`mt-6 ${CARD}`}>
        <h2 className={sectionLabelClass}>{t("client_detail_title")}</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className={sectionLabelClass}>{t("email")}</dt>
            <dd className="mt-1 text-sm text-[#151115] dark:text-[#F8F4F7]">
              {client.email ?? "—"}
            </dd>
          </div>
          <div>
            <dt className={sectionLabelClass}>{t("status")}</dt>
            <dd className="mt-1 text-sm text-[#151115] dark:text-[#F8F4F7]">
              {t(client.status === "blocked" ? "status_blocked" : "status_active")}
            </dd>
          </div>
          <div>
            <dt className={sectionLabelClass}>{t("client_name")}</dt>
            <dd className="mt-1 text-sm text-[#151115] dark:text-[#F8F4F7]">
              {client.name}
            </dd>
          </div>
        </dl>
      </section>

      <section className={`mt-6 ${CARD}`}>
        <h2 className={sectionLabelClass}>{t("location")}</h2>
        {hasCoords ? (
          <div className="mt-3">
            <div className={`h-64 overflow-hidden rounded-xl border ${BORDER}`}>
              <ClientMap
                lat={client.address_lat as number}
                lng={client.address_lng as number}
                label={client.name}
              />
            </div>
            {client.address && (
              <p className="mt-2 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
                {client.address}
              </p>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${client.address_lat},${client.address_lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-medium text-[#85587D] hover:underline dark:text-[#D8A8D3]"
            >
              {t("open_in_maps")}
            </a>
          </div>
        ) : client.address ? (
          <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
            {t("client_detail_locating")}
          </p>
        ) : (
          <p className="mt-3 text-sm opacity-60">{t("client_detail_no_location")}</p>
        )}
      </section>

      <section className={`mt-6 ${CARD}`}>
        <h2 className={sectionLabelClass}>{t("notes")}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {notes.length === 0 && (
            <p className="text-sm opacity-60">{t("no_linked_notes")}</p>
          )}
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/dashboard/notes?note=${note.id}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium text-[#85587D] transition-all duration-200 hover:border-[#85587D] dark:text-[#D8A8D3] dark:hover:border-[#D8A8D3] ${BORDER}`}
            >
              {note.title?.trim() || "—"}
            </Link>
          ))}
        </div>
      </section>

      <section className={`mt-6 ${CARD}`}>
        <h2 className={sectionLabelClass}>{t("deals")}</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {deals.length === 0 && (
            <li className="text-sm opacity-60">{t("no_deals_yet")}</li>
          )}
          {deals.map((deal) => (
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

      <section className={`mt-6 ${CARD}`}>
        <h2 className={sectionLabelClass}>{t("invoices")}</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {invoices.length === 0 && (
            <li className="text-sm opacity-60">{t("no_invoices_yet")}</li>
          )}
          {invoices.map((invoice) => (
            <li
              key={invoice.id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${BORDER}`}
            >
              <span className="text-[#151115]/70 dark:text-[#F8F4F7]/70">
                {t(invoiceStatusKey(invoice.status))}
              </span>
              <span className="font-semibold text-[#151115] dark:text-[#F8F4F7]">
                {formatCurrency(invoice.amount, locale)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
