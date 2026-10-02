"use client";

import type { FormEvent } from "react";

export default function Home() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#151115] px-6 py-16">
      <main className="flex w-full max-w-2xl flex-col items-center text-center">
        <span className="rounded-full border border-[#4A2E46] px-4 py-1 text-xs font-semibold tracking-[0.2em] text-[#D8A8D3]">
          THE AUTOPILOT WORKSPACE
        </span>

        <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight text-[#F8F4F7] sm:text-5xl md:text-6xl">
          Stop managing tools.{" "}
          <span className="text-[#D8A8D3]">Start managing business.</span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-[#F8F4F7]/70 sm:text-lg">
          LancerMents is a premium, tactical workspace built for speed,
          accessibility, and zero-touch revenue generation. Join the waitlist
          for early access to The Engine Room.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="waitlist-email" className="sr-only">
            Email address
          </label>
          <input
            id="waitlist-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full flex-1 rounded-md border border-[#4A2E46] bg-[#221C21] px-4 py-3 text-sm text-[#F8F4F7] placeholder:text-[#F8F4F7]/70 focus:border-[#D8A8D3] focus:outline-none focus:ring-1 focus:ring-[#D8A8D3]"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-[#D8A8D3] px-6 py-3 text-sm font-semibold text-[#151115] transition-opacity hover:opacity-90 sm:w-auto"
          >
            Join Waitlist
          </button>
        </form>
      </main>

      <footer className="mt-16 w-full max-w-2xl border-t border-[#4A2E46] pt-6 text-center text-sm text-[#F8F4F7]/70">
        2026 Yomunseol • Also building Caremunicate
      </footer>
    </div>
  );
}
