"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function SaveChip({ show }: { show: boolean }) {
  const t = useTranslations();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [show]);

  return (
    <span
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600 transition-opacity duration-200 dark:text-emerald-400 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <svg
        aria-hidden="true"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      {t("saved")}
    </span>
  );
}

export function ErrorBanner({
  label,
  detail,
  onRetry,
}: {
  label: string;
  detail: string;
  onRetry?: () => void;
}) {
  const t = useTranslations();

  return (
    <div className="mt-3 flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
      <div className="min-w-0 flex-1">
        <p>{label}</p>
        <p className="mt-1 break-words font-mono text-xs opacity-80">{detail}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-md border border-red-500/30 px-2.5 py-1 text-xs font-semibold transition-colors duration-200 hover:bg-red-500/10"
        >
          {t("retry")}
        </button>
      )}
    </div>
  );
}
