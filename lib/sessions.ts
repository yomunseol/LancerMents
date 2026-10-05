import { supabase } from "@/lib/supabase";

export type SessionRow = {
  session_id: string;
  device: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;
  ip: string | null;
  last_active: string | null;
  revoked: boolean | null;
};

export function parseUserAgent(ua: string) {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";

  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS X/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad|iPod/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS";

  const device = /Mobile/.test(ua)
    ? "Mobile"
    : /iPad|Tablet/.test(ua)
      ? "Tablet"
      : "Desktop";

  return { browser, os, device };
}

export async function fetchLocation(): Promise<{ location: string; ip: string | null }> {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = (await response.json()) as {
      city?: string;
      country_name?: string;
      ip?: string;
    };
    const parts = [data.city, data.country_name].filter(Boolean);
    return {
      location: parts.length > 0 ? parts.join(", ") : "Unknown location",
      ip: data.ip ?? null,
    };
  } catch {
    return { location: "Unknown location", ip: null };
  }
}

export async function trackSession(sessionId: string, userId: string) {
  const { browser, os, device } = parseUserAgent(navigator.userAgent);
  const { location, ip } = await fetchLocation();

  return supabase.from("session_ledger").upsert(
    {
      session_id: sessionId,
      user_id: userId,
      device,
      browser,
      os,
      location,
      ip,
      last_active: new Date().toISOString(),
      revoked: false,
    },
    { onConflict: "session_id" },
  );
}

export async function touchSession(sessionId: string) {
  return supabase
    .from("session_ledger")
    .update({ last_active: new Date().toISOString() })
    .eq("session_id", sessionId);
}

export async function isSessionRevoked(sessionId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("session_ledger")
      .select("revoked")
      .eq("session_id", sessionId)
      .maybeSingle();
    return (data as { revoked?: boolean | null } | null)?.revoked === true;
  } catch {
    return false;
  }
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "unknown";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "unknown";
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
