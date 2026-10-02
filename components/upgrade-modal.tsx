"use client";

import { useEffect } from "react";
import { UPGRADE_MESSAGE } from "@/lib/tiers";

export default function UpgradeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
        className="w-full max-w-md rounded-lg border border-deep-border bg-surface p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="upgrade-title" className="text-xl font-semibold text-accent-mauve">
          Premium Feature
        </h2>
        <p className="mt-3 text-primary-text">{UPGRADE_MESSAGE}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-deep-border px-4 py-2 text-sm font-medium text-primary-text transition-colors hover:border-accent-mauve"
          >
            Not now
          </button>
          <button
            type="button"
            className="rounded-md bg-accent-mauve px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Upgrade to The Pipeline
          </button>
        </div>
      </div>
    </div>
  );
}
