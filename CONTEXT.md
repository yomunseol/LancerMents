# LancerMents — Working Context

_Last updated: after OMEGA-H2 (`3a2f0d9`)._

## 1. What this is

A Next.js SaaS workspace app for freelancers/tactical operators: dual-mode marketing
landing page, cookie-based Supabase auth with MFA/OTP, multi-step onboarding wizard,
data-driven dashboard (tasks, notes, calendar, clients, CRM, invoices, analytics,
spreadsheet, security, settings, profile), a 15-locale i18n system, and a docs engine.

**Deploy target:** www.lancerments.online (Vercel, project `yomunseol/LancerMents`).

## 2. Stack (do not assume the prompts are right)

The prompts frequently say "Next.js 14 App Router". That is stale — the stack was
migrated at the founder's explicit instruction ("I did the audit fix already. Migrate to
latest").

| | Version |
|---|---|
| Next | **16.3.8** |
| Tailwind | **4.3.3** (no `tailwind.config.js` — it was deleted; v4 uses `@theme` in `app/globals.css`) |
| React | **18.3.1** |
| Supabase | `@supabase/supabase-js` + `@supabase/ssr@0.12.7` |

Other libs: `next-intl@4.14.9`, `react-markdown@^10.1.0` + `remark-gfm@^4.0.1` (MDX was
removed), `@hello-pangea/dnd`, `recharts`, `leaflet` + `react-leaflet@4.2.1` (**v5 needs
React 19 — do not upgrade**), `jspdf`, `gray-matter`.

`.npmrc` contains `include=dev` because this machine's npm has `omit=dev` baked into its
builtin config.

## 3. Design system (hard constraints)

**Dark:** canvas `#151115`, surface `#221C21`, text `#F8F4F7`, accent `#D8A8D3`,
border `#4A2E46`.
**Light:** canvas `#F8F4F7`, surface `#FFFFFF`, text `#151115`, accent `#85587D`,
border `#E2D8E0`.

- **Never** use `#603F5C` for text. `#4A2E46` is borders-only.
- Interactive pages are `'use client'`; every mutation has `try/catch` with inline error
  text; transitions are `transition-colors duration-200`; accent focus rings; no Stripe.
- Light-mode accent `#85587D` measures AA (5.2–5.7:1), **not** AAA. Implemented as
  specified; flagged rather than silently changed.

## 4. Environment / credentials

Supabase is **hardcoded** in `lib/supabase.ts` (not env-driven):

```
export const SUPABASE_URL = "https://kjbgvdchtvoisogdzghu.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_JBayD_9oWDOIM9XquhT7_w_jtbrkOMZ";
```

It uses `createBrowserClient` on purpose — switching to `createClient` would move sessions
to `localStorage` and break `middleware.ts` route protection.

## 5. Data layer

Schema was discovered by probing PostgREST's column oracle, never guessed. Confirmed:

- `workspaces(id, name, slug, owner_id, created_at)`
- `subscriptions(id, user_id, tier, status, updated_at, current_period_end)`
- `tasks(id, workspace_id, title, due_date, created_at, is_completed)` — no `description`, no `sort_order`
- `notes(id, workspace_id, title, content, pinned, updated_at)` — **no `body`, no `tags`, no `is_pinned`, no `created_at`**
- `clients(id, workspace_id, name, email, status, address, address_lat, address_lng, created_at)`
- `crm_pipelines`, `crm_deals(id, workspace_id, client_id, title, value, stage, created_at)`
- `invoices(id, workspace_id, client_id, amount, status, due_date, created_at)`
- `metrics(id, workspace_id, metric_type, value, created_at)` — **`created_at`, not `recorded_on`**
- `spreadsheets(id, workspace_id, name, data, updated_at)`
- `profiles(id, email, display_name, business_type, plan_type, locale, mfa_method)`
- `session_ledger`, `session_2fa`, `auth_otp_codes`, `docs_feedback`
- `note_tags` **does not exist** (`PGRST205`)

**Probe gotcha:** a missing column returns HTTP 400 with code **`42703`**, *not* `PGRST204`.
Checking for the wrong code makes every probe falsely read "column exists". Always run a
bogus-column negative control before trusting a probe.

### Profile persistence (OMEGA-02, `lib/profile.ts`)

`profiles` writes previously used `.update()`, which can affect 0 rows with `error === null`
— the UI said "saved" while the DB was unchanged. That was the "plans don't save" bug.

- `canonicalPlan()` — lower+trim, then map `engine-room` / `engine room` / `the engine room`
  → `engine`, `the pipeline` → `pipeline`, `the studio` → `studio`. `null` / `''` /
  `free_beta` → `null` (incomplete).
- `saveProfile(id, patch)` — `upsert({ id, ...fields }, { onConflict: 'id' })`, then
  re-selects the row and asserts **every** written field against the re-read value.
  Mismatch returns `field: wrote "x" re-read "y"`.
- Canonical plans are `engine` | `pipeline` | `studio`. Basic tier cap = **5 tasks**.

## 6. i18n

- `lib/i18n/vocab.ts` holds `VOCAB` (57 keys) + `VOCAB2` (45) + `VOCAB3` (9) = **110 keys**,
  plus `LOCALE_ORDER` (15), `RTL_LOCALES` (`ar`, `he`), `LOCALE_LABELS`.
- `messages/{af,ar,de,en,es,fr,ga,he,it,ja,ko,pt,ru,sw,zh}.json` — 15 files, **110 keys each**.
- Regenerate with `node "$COMMANDCODE_SCRATCHPAD/gen-messages.cjs"` (invert per locale,
  merge over `messages/en.json` so no key can be missing). **After adding any key to a
  VOCAB object, re-run this and re-verify parity.**
- Locale rides the `lm_locale` cookie — no URL prefix, all routes keep their URLs.
- `t('untitled')` is **not** a real key; calling it throws at render. Verify a key exists in
  `messages/en.json` before using it.

## 7. Favicon — current state and the open bug

### How we do favicons (the workflow that worked)

1. **Detect** — list the actual directories, do not trust `find` with compound `-o` groups:
   `ls -la public/` then `ls -la app/*.png app/*.ico app/*.svg`, plus
   `git ls-files | grep -iE "\.(png|ico|svg|jpg)$"`.
2. **Sanity** — `sips -g pixelWidth -g pixelHeight <file>` and `file <file>`. Must be square;
   if ratio > 1.2, apply anyway but report a warning. If ≥180px and square, iOS gets a touch
   icon too.
3. **Apply the App Router convention** — copy the source to `app/icon.png` (or
   `app/favicon.ico`), copy to `public/apple-touch-icon.png` when it qualifies, then **delete
   the stray original** so there is exactly one source of truth.
4. **Metadata** — keep `metadata.icons` free of a tab-icon declaration (`app/icon.png` should
   own that). `themeColor` goes in the **`viewport` export**, not `metadata` — Next 14+ moved
   it, and declaring it in `metadata` is ignored with a deprecation warning.
5. **Prove it** — `grep -rn 'rel="icon"' app/` → 0, `npm run build` exit 0, then the decisive
   test: `npm run start` and curl the served head for the emitted `<link rel="icon">`.

### The bug (root cause found, NOT yet fixed)

Step 5 above was run for the first time after OMEGA-H2, and it **failed**:

```
$ npm run start && curl -s localhost:3000 | grep -o '<link[^>]*icon[^>]*>'
<link rel="apple-touch-icon" href="/apple-touch-icon.png"/>     ← the ONLY icon link

rel="apple-touch-icon"   1
rel="noreferrer"         1
rel="preload"            6
rel="stylesheet"         1
                             ← no rel="icon" at all
```

Both assets serve correctly (`/icon.png` 200 `image/png` 32803 B,
`/apple-touch-icon.png` 200 `image/png` 32803 B) — so the file is fine, the **link tag is
never emitted**.

**Cause:** declaring `icons` in `metadata` makes Next skip the file-convention icon. We
declared `icons: { apple: "/apple-touch-icon.png" }` in `app/layout.tsx`, which replaced the
whole `icons` set — including the `app/icon.png` convention entry. The tab therefore has no
icon and falls back to the browser's default/Vercel one.

**Fix (next action):** remove the `icons` key from `metadata` in `app/layout.tsx` so
`app/icon.png` supplies the tab icon again, and keep the Apple touch icon either via the
`public/apple-touch-icon.png` convention (Next picks it up from `public/` without any
metadata) or by declaring it explicitly **after** confirming the tab icon still appears.
Then re-run the curl-the-head test — the acceptance criterion is a `<link rel="icon"
href="/icon.png">` in the served HTML.

### Asset inventory

| Path | Size | Role |
|---|---|---|
| `app/icon.png` | 32,803 B | tab icon (500×500 RGBA, square) |
| `public/apple-touch-icon.png` | 32,803 B | iOS home screen |
| `public/LancerMents-Light.png` | 79,029 B | navbar logo, light mode |
| `public/LancerMents-Dark.png` | 81,678 B | navbar logo, dark mode |
| `public/pexels-*.jpg` ×3 | 1.5–2.9 MB | page photography |

Note: the favicon is byte-identical to the earlier
`Black_and_White_Minimal_Brand_Logo-removebg-preview.png` (git recorded it as a 100% rename),
so the tab mark is that **monochrome** mark — not the mauve lockup. Re-export if the mauve
mark is wanted.

## 8. How the OMEGA prompts work (and how to run them)

The founder drives work as large, highly-specified `PROMPT <NAME> — <mission>` messages.
Each carries a mission, confirmed defects, a numbered work spec, exact UI classes, a
verification protocol, and a `REPORT FORMAT` of `CHECK | PASS/FAIL | EVIDENCE`.

The loop that satisfies them:

1. **Audit before writing** — run the greps the prompt asks for first; the audit often
   contradicts the prompt's premises (see below). Report the audit, don't assume.
2. **Implement only the gap.**
3. **Build gate** — `npx tsc --noEmit` (exit 0) **and** `npm run build` (exit 0). Never
   proceed on partial success.
4. **Commit + push** — one commit per part, named exactly as the prompt says, message
   ending with `Co-authored-by: CommandCodeBot <noreply@commandcode.ai>`.
5. **Self-verify with raw evidence** — paste real grep/curl/build output.
6. **Report the PASS/FAIL table**, and state plainly what is NOT done. Never report done
   with hits remaining. The founder is strict about this and has caught false claims.

### OMEGA ledger

| Prompt | What it did | Commit | Status |
|---|---|---|---|
| OMEGA-01 | Removed vulnerable `next-mdx-remote@5` → `react-markdown` + `remark-gfm`; swapped the docs renderer; `<Callout>` → blockquote; also cleared the docs 500 | `8cd5dd9` | ✅ Build gate green. Vercel deploy status **unverifiable** (no token) |
| OMEGA-02 | Profile persistence core: `lib/profile.ts` with verified `upsert` + canonical slugs; `ProfileContext.planCanonical` / `refreshProfile`; `TierGate` consumes canonical; `SaveChip` + `ErrorBanner` components | `f2af431` | ⚠️ Partial — components built but **mounted nowhere**; `refreshProfile` not wired into settings/profiles tab; only 2 `onConflict` sites exist because only one `profiles.update()` existed in the whole app |
| OMEGA-H1 | Notes create hotfix — header button, always-present rail, empty-state CTA, focus-on-create | `0c7c595` | ✅ (see notes schema note) |
| OMEGA-H2 | Favicon → `app/icon.png` + `public/apple-touch-icon.png`, strays deleted, metadata cleaned, mobile rail horizontal scroll | `3a2f0d9` | ❌ **Tab icon not emitted** — cause identified above, fix pending |

## 9. Open work, in priority order

1. **Favicon fix** (§7) — remove `metadata.icons`; prove with a `<link rel="icon">` in the
   served head. Blocks nothing else but the founder reported "it just doesn't work".
2. **OMEGA-02b** — mount `SaveChip`/`ErrorBanner` in onboarding + Settings + profile; build the
   Profiles-tab plan row (bold name + tier badge + `change_plan`); add the post-login
   canonical guard; wire `refreshProfile` into the settings/profile call sites. Then re-run the
   three `[AUTO]` greps so they go green (target ≥5 `onConflict` sites).
3. **F1 §3 exact errors** — swap the generic catch strings (audit still hits `"Could not load"`
   in `clients/page.tsx`, `calendar/page.tsx`, `security/page.tsx`, `ProfileContext.tsx`,
   `WorkspaceContext.tsx`, `TasksBoard.tsx`, `verify-2fa/page.tsx`; `"Could not add"` in
   `clients/page.tsx` + `TasksBoard.tsx`; `"Choose a plan"` in `UpgradePanel.tsx`) to
   `t('err_load')` / `t('err_save')` / `t('err_add_client')` + the raw `error.message`.
4. **F3 §6 slugs** — `lib/profile.ts` handles writes/compares; remaining call sites still need
   to route through it.
5. **Docs tail** — On-this-page TOC, floating `?` help button on `/dashboard/*`, sidebar
   "Help & Docs" entry, `metadataBase`.
6. **Smaller items** — `/login?revoked=1` banner (flag is emitted, nothing renders it);
   `notes` tag chips need a `tags`/`note_tags` migration first; mobile rail is done.

## 10. Operational gotchas learned the hard way

- **Parallel `edit_file` calls on the same file race.** Batching several edits to one file in
  a single message caused one edit to revert another (the notes rail). Edit one file at a
  time, or re-read and verify after batching.
- **Every parallel edit must be re-verified** — `replace_all` silently replaced only 1 of 3
  expected occurrences once.
- **grep "failures" are often escaping artifacts** — React splits `Step {n} of 2`; Tailwind
  escapes `.` and `:`; `.commandcode` paths contain `//`. Use fixed-string patterns.
- **`git add -A` sweeps unrelated dirt into commits.** It has already pulled a stray logo PNG
  into `0c7c595`. Check `git status` before every commit.
- **Vercel deploy status is not verifiable from here** (no token, no dashboard). Prod can only
  be probed with `curl`. Say so rather than implying a deploy succeeded.
- **`router.push` after a write must be gated on a verified write**, not on a resolved promise.
