"use client";

export default function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2D8E0] px-6 py-14 text-center dark:border-[#4A2E46]">
      {icon && <div className="opacity-70">{icon}</div>}
      <p className="mt-4 text-base font-semibold text-[#151115] dark:text-[#F8F4F7]">
        {title}
      </p>
      {subtitle && (
        <p className="mt-1 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
          {subtitle}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-lg bg-[#85587D] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 dark:bg-[#D8A8D3] dark:text-[#151115]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
