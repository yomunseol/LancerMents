import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Feedback from "../feedback";
import { getDoc, listDocs } from "../lib/loader";
import { extractHeadings } from "../lib/headings";
import { CATEGORY_ORDER } from "../docs-nav";
import { mdxComponents } from "../mdx-components";

const TOC_LABEL = "On this page";
const PREV_LABEL = "Previous";
const NEXT_LABEL = "Next";
const NAV_LABEL = "Documentation pages";
const SUPPORT_TEXT = "Need help? Email";
const SUPPORT_EMAIL = "support@lancerments.online";

type Params = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug.join("/"));
  if (!doc) return {};

  return {
    title: `${doc.meta.title} | LancerMents Docs`,
    description: doc.meta.description,
    openGraph: { title: doc.meta.title, description: doc.meta.description },
  };
}

export default async function DocPage({ params }: Params) {
  const { slug: parts } = await params;
  const slug = parts.join("/");
  const doc = getDoc(slug);
  if (!doc) notFound();

  const all = listDocs();
  const ordered = CATEGORY_ORDER.flatMap((category) =>
    all
      .filter((item) => item.category === category)
      .sort((a, b) => a.order - b.order),
  );
  const index = ordered.findIndex((item) => item.slug === slug);
  const prev = index > 0 ? ordered[index - 1] : null;
  const next = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null;
  const headings = extractHeadings(doc.content);

  return (
    <article className="max-w-5xl">
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_200px] xl:gap-10">
        <div className="min-w-0 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-[#151115] dark:text-[#F8F4F7]">
            {doc.meta.title}
          </h1>
          <p className="mt-3 text-base leading-7 text-[#151115]/70 dark:text-[#F8F4F7]/70">
            {doc.meta.description}
          </p>

          <div className="mt-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdxComponents}>
              {doc.content}
            </ReactMarkdown>
          </div>

          <Feedback page={slug} />

          <nav
            aria-label={NAV_LABEL}
            className="mt-10 flex flex-wrap justify-between gap-4 border-t border-[#E2D8E0] pt-6 dark:border-[#4A2E46]"
          >
            {prev ? (
              <Link href={`/docs/${prev.slug}`} className="group max-w-[45%]">
                <span className="block text-[11px] font-semibold tracking-widest opacity-50">
                  {PREV_LABEL}
                </span>
                <span className="mt-1 block text-sm font-medium text-[#85587D] group-hover:underline dark:text-[#D8A8D3]">
                  ← {prev.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={`/docs/${next.slug}`}
                className="group ml-auto max-w-[45%] text-right"
              >
                <span className="block text-[11px] font-semibold tracking-widest opacity-50">
                  {NEXT_LABEL}
                </span>
                <span className="mt-1 block text-sm font-medium text-[#85587D] group-hover:underline dark:text-[#D8A8D3]">
                  {next.title} →
                </span>
              </Link>
            )}
          </nav>

          <div className="mt-8 rounded-xl border border-[#E2D8E0] bg-white p-4 text-sm text-[#151115]/70 dark:border-[#4A2E46] dark:bg-[#221C21] dark:text-[#F8F4F7]/70">
            {SUPPORT_TEXT}{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-medium text-[#85587D] hover:underline dark:text-[#D8A8D3]"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>

        {headings.length > 0 && (
          <aside className="hidden xl:block">
            <div className="sticky top-24">
              <p className="text-[11px] font-semibold tracking-widest opacity-50">
                {TOC_LABEL}
              </p>
              <ul className="mt-3 flex flex-col gap-2 border-l border-[#E2D8E0] pl-3 dark:border-[#4A2E46]">
                {headings.map((heading) => (
                  <li key={heading.id} className={heading.depth === 3 ? "pl-3" : ""}>
                    <a
                      href={`#${heading.id}`}
                      className="block text-xs leading-5 text-[#151115]/70 transition-colors duration-200 hover:text-[#85587D] dark:text-[#F8F4F7]/70 dark:hover:text-[#D8A8D3]"
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </article>
  );
}
