import { listDocs } from "./lib/loader";
import DocsSidebar from "./DocsSidebar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const docs = listDocs();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:px-8">
      <DocsSidebar docs={docs} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
