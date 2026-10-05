import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type DocMeta = {
  slug: string;
  category: string;
  title: string;
  description: string;
  order: number;
};

const CONTENT_DIR = path.join(process.cwd(), "content", "docs");

function readMeta(category: string, file: string): DocMeta {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, category, file), "utf8");
  const { data } = matter(raw);
  const name = file.replace(/\.mdx$/, "");
  return {
    slug: `${category}/${name}`,
    category: typeof data.category === "string" ? data.category : category,
    title: typeof data.title === "string" ? data.title : name,
    description: typeof data.description === "string" ? data.description : "",
    order: Number(data.order ?? 0),
  };
}

export function listDocs(): DocMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const docs: DocMeta[] = [];
  for (const category of fs.readdirSync(CONTENT_DIR)) {
    const dir = path.join(CONTENT_DIR, category);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith(".mdx")) docs.push(readMeta(category, file));
    }
  }

  return docs.sort(
    (a, b) => a.category.localeCompare(b.category) || a.order - b.order,
  );
}

export function getDoc(slug: string): { meta: DocMeta; content: string } | null {
  const [category, name] = slug.split("/");
  if (!category || !name) return null;

  const file = path.join(CONTENT_DIR, category, `${name}.mdx`);
  if (!fs.existsSync(file)) return null;

  const raw = fs.readFileSync(file, "utf8");
  const { content } = matter(raw);
  return { meta: readMeta(category, `${name}.mdx`), content };
}
