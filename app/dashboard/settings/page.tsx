"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { getStoredTheme, setTheme, type ThemeMode } from "@/lib/theme";
import FeedbackBanner, {
  rawReason,
  type FeedbackState,
} from "@/app/components/FeedbackBanner";
import { useWorkspace } from "../WorkspaceContext";

const MODES: { id: ThemeMode; label: string; swatch: string[] }[] = [
  { id: "light", label: "Light", swatch: ["#F8F4F7", "#FFFFFF", "#85587D"] },
  { id: "dark", label: "Dark", swatch: ["#151115", "#221C21", "#D8A8D3"] },
  { id: "system", label: "System", swatch: ["#F8F4F7", "#221C21", "#85587D"] },
];

const DEFAULT_WS_KEY = "lancermonts.defaultWorkspaceId";

const fieldClass =
  "w-full rounded-lg border border-[#E2D8E0] bg-white px-4 py-3 text-sm text-[#151115] placeholder:text-[#151115]/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:border-[#4A2E46] dark:bg-[#221C21] dark:text-[#F8F4F7] dark:placeholder:text-[#F8F4F7]/60 dark:focus:ring-[#D8A8D3]";

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#E2D8E0] py-6 first:pt-0 last:border-b-0 last:pb-0 dark:border-[#4A2E46]">
      <h2 className="text-sm font-semibold uppercase tracking-widest opacity-60">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const t = useTranslations();
  const { workspaces, activeWorkspace, refreshWorkspaces } = useWorkspace();

  const [mode, setMode] = useState<ThemeMode>("dark");
  const [defaultWorkspace, setDefaultWorkspace] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [fb, setFb] = useState<FeedbackState>(null);
  const [dangerBusy, setDangerBusy] = useState(false);

  useEffect(() => {
    setMode(getStoredTheme());
    setDefaultWorkspace(window.localStorage.getItem(DEFAULT_WS_KEY) ?? "");
  }, []);

  useEffect(() => {
    setRenameValue(activeWorkspace?.name ?? "");
  }, [activeWorkspace?.id, activeWorkspace?.name]);

  function chooseMode(next: ThemeMode) {
    setMode(next);
    setTheme(next);
  }

  function chooseDefaultWorkspace(id: string) {
    setDefaultWorkspace(id);
    window.localStorage.setItem(DEFAULT_WS_KEY, id);
  }

  async function handleRename() {
    setFb(null);
    if (!activeWorkspace) return;
    const name = renameValue.trim();
    if (!name) {
      setFb({
        kind: "error",
        label: t("err_save"),
        raw: "Workspace name cannot be empty.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("workspaces")
        .update({ name })
        .eq("id", activeWorkspace.id);
      if (error) throw error;
      await refreshWorkspaces();
      setFb({ kind: "success", label: t("saved") });
    } catch (error) {
      setFb({ kind: "error", label: t("err_save"), raw: rawReason(error) });
    }
  }

  async function handleSignOutAll() {
    setDangerBusy(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      router.push("/login");
    } catch {
      setDangerBusy(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-[#151115] dark:text-[#F8F4F7]">
        Settings
      </h1>
      <p className="mt-1 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
        Appearance, language, workspace defaults, and your profile.
      </p>

      <div className="mt-8 max-w-2xl rounded-2xl border border-[#E2D8E0] bg-white p-8 dark:border-[#4A2E46] dark:bg-[#221C21]">
        <SectionCard title="Appearance">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {MODES.map((option) => {
              const selected = mode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => chooseMode(option.id)}
                  aria-pressed={selected}
                  className={`rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                    selected
                      ? "border-2 border-[#85587D] dark:border-[#D8A8D3]"
                      : "border-[#E2D8E0] dark:border-[#4A2E46]"
                  }`}
                >
                  <div className="flex gap-1">
                    {option.swatch.map((color) => (
                      <span
                        key={color}
                        className="h-6 w-6 rounded-md border border-[#E2D8E0] dark:border-[#4A2E46]"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="mt-3 block text-sm font-semibold text-[#151115] dark:text-[#F8F4F7]">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Workspace defaults">
          <label className="block text-sm font-medium text-[#151115] dark:text-[#F8F4F7]">
            Default workspace on login
            <select
              value={defaultWorkspace}
              onChange={(event) => chooseDefaultWorkspace(event.target.value)}
              className={`mt-2 ${fieldClass}`}
            >
              <option value="">First available</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[#151115] dark:text-[#F8F4F7]">
              Rename active workspace
              <input
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                placeholder="Workspace name"
                className={`mt-2 ${fieldClass}`}
              />
            </label>
            <button
              type="button"
              onClick={handleRename}
              disabled={!activeWorkspace}
              className="mt-3 rounded-lg bg-[#85587D] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#D8A8D3] dark:text-[#151115]"
            >
              Save name
            </button>
            {fb && (
              <FeedbackBanner
                kind={fb.kind}
                label={fb.label}
                raw={fb.raw}
                onRetry={fb.onRetry}
              />
            )}
          </div>
        </SectionCard>

        <section className="mt-6 rounded-xl border border-red-500/40 bg-red-500/5 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-red-600 opacity-80 dark:text-red-400">
            Danger zone
          </h2>
          <p className="mt-2 text-sm text-[#151115]/70 dark:text-[#F8F4F7]/70">
            Sign out of every device where you are logged in.
          </p>
          <button
            type="button"
            onClick={handleSignOutAll}
            disabled={dangerBusy}
            className="mt-3 rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400"
          >
            {dangerBusy ? "Signing out…" : "Sign out of all sessions"}
          </button>
        </section>
      </div>
    </>
  );
}
