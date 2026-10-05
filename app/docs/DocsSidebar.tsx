"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORY_LABELS, CATEGORY_ORDER, HELP_MAP } from "./docs-nav";
import type { DocMeta } from "./lib/loader";

type IndexEntry = {
  slug: string;
  category: string;
  title: string;
  headings: string[];
};

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const at = text.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded bg-[#85587D]/20 px-0.5 text-[#85587D] dark:bg-[#D8A8D3]/25 dark:text-[#D8A8D3]">
        {text.slice(at, at + query.length)}
      </mark>
      {text.slice(at + query.length)}
    </>
  );
}

export default function DocsSidebar({ docs }: { docs: DocMeta[] }) {
  const pathname = usePathname();
  const [index, setIndex] = useState<IndexEntry[]>([]);
  const [query, setQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/docs-index")
      .then((response) => response.json())
      .then((data) => setIndex(data as IndexEntry[]))
      .catch(() => undefined);
  }, []);

  // ?from=/dashboard/tasks → pre-expand the matching category
  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (!from) return;
    const last = from.split("/").filter(Boolean).pop() ?? "";
    const category = HELP_MAP[last];
    if (category) setOpenCategory(category);
  }, []);

  const categories = CATEGORY_ORDER.filter((category) =>
    docs.some((doc) => doc.category === category),
  );

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return index
      .map((entry) => ({
        entry,
        headings: entry.headings.filter((heading) =>
          heading.toLowerCase().includes(term),
        ),
      }))
      .filter(
        ({ entry, headings }) =>
          entry.title.toLowerCase().includes(term) || headings.length > 0,
      )
      .slice(0, 8);
  }, [index, query]);

  return (
    <aside className="w-full shrink-0 md:w-64">
      <div className="md:sticky md:top-20">
        <div className="relative">
          <label htmlFor="docs-search" className="sr-only">
            Search docs
          </label>
          <input
            id="docs-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setQuery("");
            }}
            placeholder="Search docs…"
            className="w-full rounded-lg border border-[#E2D8E0] bg-white px-3 py-2 text-sm text-[#151115] placeholder:text-[#151115]/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#85587D] dark:border-[#4A2E46] dark:bg-[#221C21] dark:text-[#F8F4F7] dark:placeholder:text-[#F8F4F7]/60 dark:focus:ring-[#D8A8D3]"
          />

          {results.length > 0 && (
            <ul className="absolute left-0 right-0 z-40 mt-2 max-h-80 overflow-auto rounded-xl border border-[#E2D8E0] bg-white p-1 shadow-xl dark:border-[#4A2E46] dark:bg-[#221C21]">
              {results.map(({ entry, headings }) => (
                <li key={entry.slug}>
                  <Link
                    href={`/docs/${entry.slug}`}
                    onClick={() => setQuery("")}
                    className="block rounded-lg px-3 py-2 text-sm text-[#151115] transition-colors duration-200 hover:bg-[#85587D]/10 dark:text-[#F8F4F7] dark:hover:bg-[#D8A8D3]/10"
                  >
                    <Highlight text={entry.title} query={query} />
                    {headings.length > 0 && (
                      <span className="mt-0.5 block text-xs opacity-60">
                        <Highlight text={headings[0]} query={query} />
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav className="mt-6 flex flex-col gap-4">
          {categories.map((category) => {
            const pages = docs.filter((doc) => doc.category === category);
            const collapsed = openCategory !== category && openCategory !== null;
            return (
              <div key={category}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenCategory(collapsed ? category : openCategory === category ? null : category)
                  }
                  className="w-full text-left text-xs font-semibold uppercase tracking-widest opacity-60 transition-opacity duration-200 hover:opacity-100"
                >
                  {CATEGORY_LABELS[category] ?? category}
                </button>
                {!collapsed && (
                  <ul className="mt-2 flex flex-col gap-0.5">
                    {pages.map((doc) => {
                      const active = pathname === `/docs/${doc.slug}`;
                      return (
                        <li key={doc.slug}>
                          <Link
                            href={`/docs/${doc.slug}`}
                            className={`block rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                              active
                                ? "bg-[#85587D]/10 font-semibold text-[#85587D] dark:bg-[#D8A8D3]/10 dark:text-[#D8A8D3]"
                                : "text-[#151115]/80 hover:bg-[#85587D]/10 dark:text-[#F8F4F7]/80 dark:hover:bg-[#D8A8D3]/10"
                            }`}
                          >
                            {doc.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
