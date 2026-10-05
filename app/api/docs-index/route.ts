import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { listDocs } from "../../docs/lib/loader";

const CONTENT_DIR = path.join(process.cwd(), "content", "docs");

function headingsOf(slug: string): string[] {
  try {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, `${slug}.mdx`), "utf8");
    const headings: string[] = [];
    const pattern = /^#{2,3}\s+(.+)$/gm;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(raw)) !== null) {
      headings.push(match[1].trim());
    }
    return headings;
  } catch {
    return [];
  }
}

export async function GET() {
  const index = listDocs().map((doc) => ({
    slug: doc.slug,
    category: doc.category,
    title: doc.title,
    headings: headingsOf(doc.slug),
  }));

  return NextResponse.json(index);
}
