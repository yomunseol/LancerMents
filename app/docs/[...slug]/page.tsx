import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Feedback from "../feedback";
import { getDoc, listDocs } from "../lib/loader";
import { mdxComponents } from "../mdx-components";

type Params = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug.join("/"));
  if (!doc) return {};

  return {
    title: `${doc.meta.title} — LancerMents Docs`,
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
  const index = all.findIndex((item) => item.slug === slug);
  const prev = index > 0 ? all[index - 1] : null;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  return (
    <article className="max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight text-[#151115] dark:text-[#F8F4F7]">
        {doc.meta.title}
      </h1>
      <p className="mt-3 text-base leading-7 text-[#151115]/70 dark:text-[#F8F4F7]/70">
        {doc.meta.description}
      </p>

      <div className="mt-8">
        <MDXRemote source={doc.content} components={mdxComponents} />
      </div>

      <Feedback page={slug} />

      <nav className="mt-10 flex flex-wrap justify-between gap-4 border-t border-[#E2D8E0] pt-6 dark:border-[#4A2E46]">
        {prev ? (
          <Link
            href={`/docs/${prev.slug}`}
            className="text-sm font-medium text-[#85587D] transition-colors duration-200 hover:underline dark:text-[#D8A8D3]"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/docs/${next.slug}`}
            className="text-sm font-medium text-[#85587D] transition-colors duration-200 hover:underline dark:text-[#D8A8D3]"
          >
            {next.title} →
          </Link>
        )}
      </nav>
    </article>
  );
}
