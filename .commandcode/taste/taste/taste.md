# Taste
- Prefers Next.js (14) with the App Router, TypeScript, and Tailwind CSS for web/app projects. Confidence: 0.55
- Uses Supabase (`@supabase/supabase-js`) for auth/backend, initialized via a client module (e.g. `lib/supabase.ts`) reading `NEXT_PUBLIC_*` config from `.env.local`. Confidence: 0.5
- Defines design systems as semantic color tokens in the Tailwind theme (e.g. `background`, `surface`, `primary-text`, `accent-*`, `deep-border`) and references them by name in classes, rather than hardcoding hex values in markup. Confidence: 0.55
- Supplies exact hex color palettes with named roles (canvas background, surface/cards, primary text, accent) and explicit prohibitions (e.g. "NEVER use #603F5C for text"), expecting them followed precisely. Confidence: 0.5
- Requires strict accessibility compliance, including WCAG AAA text contrast against the defined background. Confidence: 0.5
- When scaffolding a project into a directory already named for the project, expects it set up in place rather than creating a redundant nested subfolder. Confidence: 0.45
- Expects a checked-in-style `.env.local` template created with placeholder values for required config/secrets. Confidence: 0.4
- Values giving end users enough to actually operate on: favors permissive free-tier limits (e.g. Basic = 5 tasks) and real/seed data over restrictive caps or "fake" single-item states. Confidence: 0.5
- Prefers the agent to proceed with best-judgment defaults rather than stalling on clarifying questions. Confidence: 0.45
