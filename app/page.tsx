const engineRoomFeatures = [
  "Unlimited daily task boards",
  "One tactical workspace",
  "Speed-first, accessible UI",
];

const pipelineFeatures = [
  "Everything in The Engine Room",
  "CRM pipeline & deals",
  "Unlimited workspaces",
  "Priority support",
];

const studioFeatures = [
  "Everything in The Pipeline",
  "Team seats & roles",
  "Advanced automation",
  "Custom integrations",
];

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 flex flex-col gap-3 text-sm" style={{ color: "#F8F4F7" }}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span aria-hidden="true" style={{ color: "#D8A8D3" }}>
            •
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#151115" }}>
      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center">
        <span
          className="rounded-full border px-4 py-1 text-xs font-semibold tracking-[0.2em]"
          style={{ color: "#D8A8D3", borderColor: "#4A2E46" }}
        >
          THE AUTOPILOT WORKSPACE
        </span>

        <h1
          className="mt-8 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl"
          style={{ WebkitTextStroke: "1px #85587D" }}
        >
          <span style={{ color: "#F8F4F7" }}>Stop managing tools.</span>{" "}
          <span style={{ color: "#D8A8D3" }}>Start managing business.</span>
        </h1>

        <p
          className="mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
          style={{ color: "#F8F4F7", opacity: 0.8 }}
        >
          LancerMents is a premium, tactical workspace built for speed and
          clarity. Join the waitlist for early access to The Engine Room.
        </p>

        <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            readOnly
            aria-label="Email address"
            placeholder="you@example.com"
            className="w-full flex-1 rounded-md border px-4 py-3 text-sm outline-none placeholder:text-[#F8F4F7]/70"
            style={{
              backgroundColor: "#221C21",
              borderColor: "#4A2E46",
              color: "#F8F4F7",
            }}
          />
          <button
            type="button"
            className="w-full rounded-md px-6 py-3 text-sm font-semibold sm:w-auto"
            style={{ backgroundColor: "#D8A8D3", color: "#151115" }}
          >
            Join Waitlist
          </button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <div
          className="grid grid-cols-1 gap-6 pt-12 md:grid-cols-3"
          style={{ borderTop: "1px solid #4A2E46" }}
        >
          <article
            className="flex flex-col rounded-xl border p-6"
            style={{ backgroundColor: "#221C21", borderColor: "#4A2E46" }}
          >
            <h3 className="text-lg font-semibold" style={{ color: "#F8F4F7" }}>
              The Engine Room
            </h3>
            <p className="mt-2">
              <span className="text-3xl font-bold" style={{ color: "#F8F4F7" }}>
                $9
              </span>
              <span className="text-sm" style={{ color: "#F8F4F7", opacity: 0.8 }}>
                /mo
              </span>
            </p>
            <FeatureList items={engineRoomFeatures} />
            <div className="mt-auto pt-8">
              <button
                type="button"
                className="w-full rounded-md border px-4 py-2 text-sm font-semibold"
                style={{ borderColor: "#4A2E46", color: "#F8F4F7" }}
              >
                Coming Soon
              </button>
            </div>
          </article>

          <article
            className="relative flex flex-col rounded-xl border p-6"
            style={{ backgroundColor: "#221C21", borderColor: "#D8A8D3" }}
          >
            <span
              className="absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.15em]"
              style={{ backgroundColor: "#D8A8D3", color: "#151115" }}
            >
              POPULAR
            </span>
            <h3 className="text-lg font-semibold" style={{ color: "#F8F4F7" }}>
              The Pipeline
            </h3>
            <p className="mt-2">
              <span className="text-3xl font-bold" style={{ color: "#F8F4F7" }}>
                $19
              </span>
              <span className="text-sm" style={{ color: "#F8F4F7", opacity: 0.8 }}>
                /mo
              </span>
            </p>
            <FeatureList items={pipelineFeatures} />
            <div className="mt-auto pt-8">
              <button
                type="button"
                className="w-full rounded-md px-4 py-2 text-sm font-semibold"
                style={{ backgroundColor: "#D8A8D3", color: "#151115" }}
              >
                Coming Soon
              </button>
            </div>
          </article>

          <article
            className="flex flex-col rounded-xl border p-6"
            style={{ backgroundColor: "#221C21", borderColor: "#4A2E46" }}
          >
            <h3 className="text-lg font-semibold" style={{ color: "#F8F4F7" }}>
              The Studio
            </h3>
            <p className="mt-2">
              <span className="text-3xl font-bold" style={{ color: "#F8F4F7" }}>
                $49
              </span>
              <span className="text-sm" style={{ color: "#F8F4F7", opacity: 0.8 }}>
                /mo
              </span>
            </p>
            <FeatureList items={studioFeatures} />
            <div className="mt-auto pt-8">
              <button
                type="button"
                className="w-full rounded-md border px-4 py-2 text-sm font-semibold"
                style={{ borderColor: "#4A2E46", color: "#F8F4F7" }}
              >
                Coming Soon
              </button>
            </div>
          </article>
        </div>
      </section>

      <footer
        className="px-6 py-8 text-center text-sm"
        style={{ borderTop: "1px solid #4A2E46" }}
      >
        <p style={{ color: "#F8F4F7" }}>
          2026 Yomunseol • Also building{" "}
          <a
            href="https://caremunicate.online"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline-offset-4 hover:underline"
            style={{ color: "#D8A8D3" }}
          >
            Caremunicate
          </a>
        </p>
      </footer>
    </div>
  );
}
