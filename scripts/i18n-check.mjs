import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const scanDir = join(root, "app");
const whitelistPath = join(root, "i18n-whitelist.json");
const whitelist = existsSync(whitelistPath)
  ? JSON.parse(readFileSync(whitelistPath, "utf8"))
  : [];
const allowed = new Set(whitelist);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

// (a) JSX text literals: a tag-close '>' followed by Text then '<'
//     (requires the char before '>' to be a tag/attr char, so `=> Promise<` is ignored)
const TEXT_RE = /[a-zA-Z0-9")\]/]\s*>\s*([A-Z][A-Za-z0-9 ,'’&./!?-]{3,})\s*</g;
// (b) attributes with a plain string literal (not {...})
const ATTR_RE = /\b(placeholder|aria-label|title|alt)\s*=\s*"([^"{][^"]*)"/g;

let hits = 0;

function lineOf(src, index) {
  return src.slice(0, index).split("\n").length;
}

for (const file of walk(scanDir)) {
  const rel = relative(root, file);
  const src = readFileSync(file, "utf8");

  // (a) inline JSX text nodes anywhere in the file (spans newlines, cannot cross tags)
  TEXT_RE.lastIndex = 0;
  let m;
  while ((m = TEXT_RE.exec(src))) {
    const text = m[1].trim();
    if (allowed.has(text)) continue;
    console.log(`${rel}:${lineOf(src, m.index)}: JSX text "${text}"`);
    hits++;
  }

  // (b) attributes with a plain string literal (not {...}), per line
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("{t(") || line.includes("{`")) continue;
    ATTR_RE.lastIndex = 0;
    while ((m = ATTR_RE.exec(line))) {
      if (allowed.has(m[2])) continue;
      console.log(`${rel}:${i + 1}: ${m[1]}="${m[2]}"`);
      hits++;
    }
  }
}

if (hits > 0) {
  console.error(`\ni18n:check FAILED — ${hits} untranslated literal(s).`);
  process.exit(1);
}
console.log("i18n:check OK — no untranslated literals.");
