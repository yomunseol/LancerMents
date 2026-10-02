"use client";

import type { CrmDeal, CrmPipeline } from "@/lib/types";

const STAGE_ORDER = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
const UNPLACED = "Unplaced";

function stageRank(stage: string): number {
  const index = STAGE_ORDER.indexOf(stage.toLowerCase());
  return index === -1 ? STAGE_ORDER.length : index;
}

function formatValue(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "No value";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CrmKanban({
  pipelines,
  deals,
}: {
  pipelines: CrmPipeline[];
  deals: CrmDeal[];
}) {
  const pipelineName = pipelines[0]?.name ?? "Pipeline";
  const present = Array.from(
    new Set(deals.map((deal) => deal.stage?.trim() || UNPLACED)),
  ).sort((a, b) => stageRank(a) - stageRank(b) || a.localeCompare(b));
  const columns = present.length > 0 ? present : [UNPLACED];

  return (
    <section
      aria-label="CRM pipeline"
      className="rounded-lg border border-deep-border bg-surface p-5"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-primary-text">{pipelineName}</h2>
        <span className="text-sm text-primary-text/70">
          {deals.length} {deals.length === 1 ? "deal" : "deals"}
        </span>
      </header>

      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {columns.map((stage) => {
          const stageDeals = deals.filter(
            (deal) => (deal.stage?.trim() || UNPLACED) === stage,
          );
          return (
            <div
              key={stage}
              className="w-64 flex-shrink-0 rounded-lg border border-deep-border bg-background p-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-accent-mauve">{stage}</h3>
                <span className="text-xs text-primary-text/70">
                  {stageDeals.length}
                </span>
              </div>
              <ul className="mt-3 flex flex-col gap-2">
                {stageDeals.map((deal) => (
                  <li
                    key={deal.id}
                    className="rounded-md border border-deep-border bg-surface p-3"
                  >
                    <p className="text-sm font-medium text-primary-text">
                      {deal.title}
                    </p>
                    <p className="mt-1 text-xs font-medium text-accent-mauve">
                      {formatValue(deal.value)}
                    </p>
                  </li>
                ))}
                {stageDeals.length === 0 && (
                  <li className="rounded-md border border-dashed border-deep-border p-3 text-xs text-primary-text/70">
                    No deals
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
