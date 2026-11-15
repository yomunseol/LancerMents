export type DocHeading = {
  depth: number;
  text: string;
  id: string;
};

export function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

export function extractHeadings(markdown: string): DocHeading[] {
  const headings: DocHeading[] = [];
  const pattern = /^(##|###)\s+(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(markdown)) !== null) {
    const text = match[2].replace(/[*_`]/g, "").trim();
    headings.push({
      depth: match[1].length,
      text,
      id: slugifyHeading(text),
    });
  }

  return headings;
}
