"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { NAV_ITEMS, isNavLocked, type NavIcon } from "./nav-config";
import { useProfile } from "./ProfileContext";
import { WorkspaceProvider, useWorkspace } from "./WorkspaceContext";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

const ICON_PATHS: Record<NavIcon, string> = {
  dashboard: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  tasks: "M4 7l2 2 4-4M14 8h6M4 17l2 2 4-4M14 18h6",
  notes: "M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7",
  calendar: "M4 6h16v15H4zM4 10h16M9 3v4M15 3v4",
  clients: "M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M5 20a7 7 0 0 1 14 0",
  crm: "M3 7h18v13H3zM8 7V4h8v3M3 13h18",
  invoices: "M6 3h12v18H6zM9 8h6M9 12h6M9 16h4",
  analytics: "M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3",
  spreadsheet: "M3 5h18v14H3zM3 10h18M3 15h18M9 5v14M15 5v14",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M5 20a7 7 0 0 1 14 0",
  security: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 13.5l1.6-.9-2-3.4-1.6.9a7.6 7.6 0 0 0-1.8-1L15.4 7h-4l-.2 2.1a7.6 7.6 0 0 0-1.8 1l-1.6-.9-2 3.4 1.6.9a7.6 7.6 0 0 0 0 2.1l-1.6.9 2 3.4 1.6-.9c.5.4 1.1.8 1.8 1l.2 2.1h4l.2-2.1c.7-.2 1.3-.6 1.8-1l1.6.9 2-3.4-1.6-.9a7.6 7.6 0 0 0 0-2.1Z",
};

function NavIconSvg({ icon }: { icon: NavIcon }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d={ICON_PATHS[icon]} />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="shrink-0 opacity-60"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const { planType } = useProfile();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="w-full shrink-0 border-b border-[#E2D8E0] bg-white p-6 pt-6 md:w-64 md:border-b-0 md:border-r dark:border-[#4A2E46] dark:bg-[#221C21]">
      <WorkspaceSwitcher />

      <nav className="mt-6 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const locked = isNavLocked(item, planType ?? "basic");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                active
                  ? "bg-white font-semibold text-[#85587D] dark:bg-[#221C21] dark:text-[#D8A8D3]"
                  : "font-medium text-[#151115]/80 hover:bg-[#85587D]/10 dark:text-[#F8F4F7]/80 dark:hover:bg-[#D8A8D3]/10"
              }`}
            >
              <NavIconSvg icon={item.icon} />
              <span className="flex-1 truncate">{t(item.key)}</span>
              {locked && <LockIcon />}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 w-full rounded-lg border border-[#E2D8E0] px-4 py-2.5 text-sm font-semibold text-[#151115] transition-all duration-200 hover:shadow-lg dark:border-[#4A2E46] dark:text-[#F8F4F7]"
      >
        {t("logout")}
      </button>
    </aside>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen flex-col pt-16 md:flex-row">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-10 md:px-10">{children}</main>
      </div>
    </WorkspaceProvider>
  );
}
