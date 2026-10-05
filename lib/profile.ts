import { supabase } from "@/lib/supabase";

export const CANONICAL_PLANS = ["engine", "pipeline", "studio"] as const;
export type CanonicalPlan = (typeof CANONICAL_PLANS)[number];

const LEGACY_PLAN_MAP: Record<string, CanonicalPlan> = {
  "engine-room": "engine",
  "engine room": "engine",
  "the engine room": "engine",
  "the pipeline": "pipeline",
  "the studio": "studio",
};

export function canonicalPlan(
  value: string | null | undefined,
): CanonicalPlan | null {
  if (!value) return null;
  const key = value.toLowerCase().trim();
  if (!key || key === "free_beta") return null;
  if ((CANONICAL_PLANS as readonly string[]).includes(key)) {
    return key as CanonicalPlan;
  }
  return LEGACY_PLAN_MAP[key] ?? null;
}

export type SaveResult =
  | { ok: true; row: Record<string, unknown> }
  | { ok: false; error: string };

export async function saveProfile(
  id: string,
  patch: Record<string, unknown>,
): Promise<SaveResult> {
  const fields: Record<string, unknown> = { ...patch };

  if ("plan_type" in fields) {
    const canonical = canonicalPlan(fields.plan_type as string | null);
    if (!canonical) {
      return {
        ok: false,
        error: `plan_type: "${String(fields.plan_type)}" is not a canonical plan`,
      };
    }
    fields.plan_type = canonical;
  }

  const { error: writeError } = await supabase
    .from("profiles")
    .upsert({ id, ...fields }, { onConflict: "id" });

  if (writeError) return { ok: false, error: writeError.message };

  const { data, error: readError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError) return { ok: false, error: readError.message };
  if (!data) return { ok: false, error: `profiles row ${id} missing after upsert` };

  const row = data as Record<string, unknown>;
  for (const [key, written] of Object.entries(fields)) {
    const read = row[key];
    if (key === "plan_type") {
      if (
        canonicalPlan(read as string | null) !==
        canonicalPlan(written as string | null)
      ) {
        return {
          ok: false,
          error: `plan_type: wrote "${String(written)}" re-read "${String(read)}"`,
        };
      }
      continue;
    }
    if (read !== written) {
      return {
        ok: false,
        error: `${key}: wrote "${String(written)}" re-read "${String(read)}"`,
      };
    }
  }

  return { ok: true, row };
}
