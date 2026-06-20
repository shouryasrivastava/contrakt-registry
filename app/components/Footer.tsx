import Link from "next/link";

const LINKS: { label: string; href: string }[] = [
  { label: "Docs", href: "https://github.com/shouryasrivastava/contrakt#readme" },
  { label: "GitHub", href: "https://github.com/shouryasrivastava/contrakt" },
  { label: "npm", href: "https://www.npmjs.com/package/contrakt" },
  { label: "Twitter", href: "https://x.com/shouryasrivastava" },
];

/** One quiet line of text links. */
export default function Footer() {
  return (
    <footer className="mt-20 pb-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="px-1 py-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-muted">
          <div className="mr-2 min-w-[112px]">
            <p className="text-ink font-semibold text-sm">contrakt</p>
            <p className="text-faint uppercase tracking-[0.2em] text-[10px] mt-1">public registry</p>
          </div>
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <span className="ml-auto text-faint">
            Built by{" "}
            <Link href="https://x.com/shouryasrivastava" target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-colors">
              @shouryasrivastava
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
