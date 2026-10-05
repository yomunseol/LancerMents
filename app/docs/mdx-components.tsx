export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <aside className="my-6 rounded-xl border-l-4 border-[#85587D] bg-[#85587D]/10 px-5 py-4 text-sm leading-6 text-[#151115] dark:border-[#D8A8D3] dark:bg-[#D8A8D3]/10 dark:text-[#F8F4F7]">
      {children}
    </aside>
  );
}

export const mdxComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="mt-10 scroll-mt-24 text-2xl font-bold text-[#151115] dark:text-[#F8F4F7]"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="mt-8 scroll-mt-24 text-lg font-semibold text-[#151115] dark:text-[#F8F4F7]"
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mt-4 leading-7 text-[#151115]/85 dark:text-[#F8F4F7]/85" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-[#151115]/85 dark:text-[#F8F4F7]/85" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mt-4 list-decimal space-y-2 pl-6 leading-7 text-[#151115]/85 dark:text-[#F8F4F7]/85" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="font-medium text-[#85587D] underline underline-offset-4 dark:text-[#D8A8D3]"
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-[#151115] dark:text-[#F8F4F7]" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="rounded bg-[#85587D]/10 px-1.5 py-0.5 text-sm text-[#85587D] dark:bg-[#D8A8D3]/15 dark:text-[#D8A8D3]"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="mt-4 overflow-x-auto rounded-xl border border-[#E2D8E0] bg-[#221C21] p-4 text-sm text-[#F8F4F7] dark:border-[#4A2E46]"
      {...props}
    />
  ),
  Callout,
};
