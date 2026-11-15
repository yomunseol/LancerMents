"use client";

import { useEffect, useState } from "react";

const BORDER = "border-[#E2D8E0] dark:border-[#4A2E46]";
const CARD = `rounded-2xl border bg-white shadow-xl dark:bg-[#221C21] ${BORDER}`;
const LABEL = "text-[11px] uppercase tracking-widest opacity-60";

const TEXT = {
  gridAria:
    "Interactive preview of the LancerMents daily grid, with tasks you can check off, a notes panel, and a running client timer",
  gridTitle: "Daily grid",
  today: "Today",
  done: "done",
  notes: "Notes",
  notesBody:
    "Acme wants the homepage live before their launch on the 28th. Send the invoice after the final review.",
  timer: "Client timer",
  timerClient: "Acme Studio",
  start: "Start timer",
  pause: "Pause timer",
  timerAria: "Client timer for Acme Studio",
  invoiceAria:
    "Preview of a LancerMents invoice summary with line items, total, status, and due date",
  invoiceTitle: "Invoice",
  invoiceNumber: "LM-04A2F1",
  invoiceClient: "Acme Studio",
  invoiceStatus: "Sent",
  invoiceDue: "Due Nov 28",
  invoiceItems: [
    { label: "Landing page design", amount: "$1,400" },
    { label: "Frontend build", amount: "$1,000" },
  ],
  invoiceSubtotal: "Subtotal",
  invoiceTotal: "Total",
  invoiceTotalValue: "$2,400",
  invoiceFoot: "Payment status stays visible in the invoice list.",
  clientAria:
    "Preview of a LancerMents client card with contact details, status, and today's work timeline",
  clientTitle: "Client",
  clientName: "Acme Studio",
  clientEmail: "billing@acme.studio",
  clientStatus: "Active",
  clientAddress: "18 Marlow St, London",
  clientSince: "Client since Mar 2026",
  clientEmailLabel: "Email",
  clientAddressLabel: "Address",
  clientSinceLabel: "Since",
  rhythmTitle: "Today",
  rhythmAria: "Today's schedule for Acme Studio",
};

const INITIAL_TASKS = [
  { id: "t1", title: "Send Acme Studio invoice", client: "Acme Studio", done: false },
  { id: "t2", title: "Review homepage copy", client: "Acme Studio", done: true },
  { id: "t3", title: "Book launch call", client: "Northwind", done: false },
];

const RHYTHM = [
  { time: "09:30", label: "Kickoff call", state: "Past" },
  { time: "11:00", label: "Homepage draft", state: "Now" },
  { time: "14:15", label: "Invoice sent", state: "Later" },
];

function formatClock(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  );
}

export function DailyGridMockup() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [seconds, setSeconds] = useState(107);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const done = tasks.filter((task) => task.done).length;

  return (
    <section
      aria-label={TEXT.gridAria}
      className={`w-full overflow-hidden ${CARD}`}
    >
      <div className={`flex items-center justify-between border-b px-5 py-4 ${BORDER}`}>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#85587D] dark:bg-[#D8A8D3]" />
          <h3 className="text-sm font-semibold text-[#151115] dark:text-[#F8F4F7]">
            {TEXT.gridTitle}
          </h3>
          <span className={`${LABEL} hidden sm:inline`}>{TEXT.today}</span>
        </div>
        <span className="text-xs opacity-60">
          {done}/{tasks.length} {TEXT.done}
        </span>
      </div>

      <ul className="flex flex-col gap-1 p-3">
        {tasks.map((task) => (
          <li key={task.id}>
            <button
              type="button"
              aria-pressed={task.done}
              onClick={() =>
                setTasks((current) =>
                  current.map((item) =>
                    item.id === task.id ? { ...item, done: !item.done } : item,
                  ),
                )
              }
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200 hover:bg-[#85587D]/5 dark:hover:bg-[#D8A8D3]/10 ${
                task.done ? "opacity-60" : ""
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  task.done
                    ? "border-[#85587D] bg-[#85587D] dark:border-[#D8A8D3] dark:bg-[#D8A8D3]"
                    : BORDER
                }`}
              >
                {task.done && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="text-white dark:text-[#151115]"
                  >
                    <path d="M5 12l4 4L19 6" />
                  </svg>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-sm text-[#151115] dark:text-[#F8F4F7] ${
                    task.done ? "line-through" : ""
                  }`}
                >
                  {task.title}
                </span>
                <span className="block truncate text-xs opacity-60">{task.client}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className={`mx-3 rounded-xl border p-3 ${BORDER}`}>
        <p className={LABEL}>{TEXT.notes}</p>
        <p className="mt-1 text-xs leading-5 text-[#151115]/80 dark:text-[#F8F4F7]/80">
          {TEXT.notesBody}
        </p>
      </div>

      <div
        className={`mt-3 flex items-center justify-between gap-3 border-t px-5 py-4 ${BORDER}`}
      >
        <div className="min-w-0">
          <p className={LABEL}>{TEXT.timer}</p>
          <p className="truncate text-sm font-semibold text-[#151115] dark:text-[#F8F4F7]">
            {TEXT.timerClient}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-lg font-semibold tabular-nums text-[#85587D] dark:text-[#D8A8D3]"
            aria-live="polite"
            aria-label={TEXT.timerAria}
          >
            {formatClock(seconds)}
          </span>
          <button
            type="button"
            onClick={() => setRunning((value) => !value)}
            aria-label={running ? TEXT.pause : TEXT.start}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#85587D] text-white transition-colors duration-200 hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]"
          >
            {running ? <PauseIcon /> : <PlayIcon />}
          </button>
        </div>
      </div>
    </section>
  );
}

export function InvoiceMockup() {
  return (
    <section aria-label={TEXT.invoiceAria} className={`w-full ${CARD}`}>
      <div className={`flex items-start justify-between border-b px-5 py-4 ${BORDER}`}>
        <div>
          <p className={LABEL}>{TEXT.invoiceTitle}</p>
          <h3 className="mt-1 text-lg font-bold text-[#151115] dark:text-[#F8F4F7]">
            {TEXT.invoiceClient}
          </h3>
          <p className="text-xs opacity-60">{TEXT.invoiceNumber}</p>
        </div>
        <div className="text-right">
          <span className="inline-block rounded-full border border-[#85587D]/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#85587D] dark:border-[#D8A8D3]/40 dark:text-[#D8A8D3]">
            {TEXT.invoiceStatus}
          </span>
          <p className="mt-1 text-xs opacity-60">{TEXT.invoiceDue}</p>
        </div>
      </div>

      <ul className={`flex flex-col divide-y px-5 ${BORDER}`}>
        {TEXT.invoiceItems.map((item) => (
          <li key={item.label} className="flex items-center justify-between py-3 text-sm">
            <span className="text-[#151115] dark:text-[#F8F4F7]">{item.label}</span>
            <span className="tabular-nums opacity-70">{item.amount}</span>
          </li>
        ))}
      </ul>

      <div className={`flex items-center justify-between border-t px-5 py-4 ${BORDER}`}>
        <span className={LABEL}>{TEXT.invoiceTotal}</span>
        <span className="text-2xl font-extrabold tabular-nums text-[#151115] dark:text-[#F8F4F7]">
          {TEXT.invoiceTotalValue}
        </span>
      </div>

      <p className={`border-t px-5 py-3 text-xs opacity-60 ${BORDER}`}>
        {TEXT.invoiceFoot}
      </p>
    </section>
  );
}

export function ClientCardMockup() {
  return (
    <section aria-label={TEXT.clientAria} className={`w-full ${CARD}`}>
      <div className={`flex items-start justify-between border-b px-5 py-4 ${BORDER}`}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#85587D]/15 text-sm font-bold text-[#85587D] dark:bg-[#D8A8D3]/15 dark:text-[#D8A8D3]">
            AS
          </span>
          <div>
            <p className={LABEL}>{TEXT.clientTitle}</p>
            <h3 className="text-base font-bold text-[#151115] dark:text-[#F8F4F7]">
              {TEXT.clientName}
            </h3>
          </div>
        </div>
        <span className="rounded-full border border-[#85587D]/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#85587D] dark:border-[#D8A8D3]/40 dark:text-[#D8A8D3]">
          {TEXT.clientStatus}
        </span>
      </div>

      <dl className="flex flex-col gap-2 px-5 py-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className={LABEL}>{TEXT.clientEmailLabel}</dt>
          <dd className="truncate text-[#151115] dark:text-[#F8F4F7]">{TEXT.clientEmail}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className={LABEL}>{TEXT.clientAddressLabel}</dt>
          <dd className="truncate opacity-70">{TEXT.clientAddress}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className={LABEL}>{TEXT.clientSinceLabel}</dt>
          <dd className="opacity-70">{TEXT.clientSince}</dd>
        </div>
      </dl>

      <div className={`border-t px-5 py-4 ${BORDER}`}>
        <p className={LABEL}>{TEXT.rhythmTitle}</p>
        <ol className="mt-3 flex flex-col gap-3" aria-label={TEXT.rhythmAria}>
          {RHYTHM.map((step) => (
            <li key={step.time} className="flex items-center gap-3">
              <span className="w-10 shrink-0 font-mono text-xs tabular-nums opacity-60">
                {step.time}
              </span>
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  step.state === "Now"
                    ? "bg-[#85587D] ring-4 ring-[#85587D]/20 dark:bg-[#D8A8D3] dark:ring-[#D8A8D3]/20"
                    : "bg-[#E2D8E0] dark:bg-[#4A2E46]"
                }`}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-[#151115] dark:text-[#F8F4F7]">
                {step.label}
              </span>
              <span className="text-[11px] uppercase tracking-widest opacity-50">
                {step.state}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
