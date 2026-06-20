import CopyButton from "./CopyButton";

export default function CodeBlock({
  code,
  lang = "text",
  title,
  className = "",
}: {
  code: string;
  lang?: "json" | "bash" | "text";
  title?: string;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-lg border border-border bg-white ${className}`}>
      <div className="flex items-center justify-between border-b border-border bg-inset/70 px-3 py-1.5">
        <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-faint">
          {title ?? lang}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto px-3 py-3 text-[11px] leading-[1.55] font-mono text-ink2">
        {lang === "json" ? <JsonHighlight code={code} /> : <BashHighlight code={code} lang={lang} />}
      </pre>
    </div>
  );
}

function JsonHighlight({ code }: { code: string }) {
  const tokens = code.split(/(\"(?:\\.|[^\"\\])*\"\s*:|\"(?:\\.|[^\"\\])*\"|\b(?:true|false|null)\b|-?\d+\.?\d*)/g);
  return (
    <code>
      {tokens.map((t, i) => {
        if (!t) return null;
        if (/^".*":$/.test(t.trim()) || /^"(?:\\.|[^"\\])*"\s*:$/.test(t)) {
          return <span key={i} className="text-limefg">{t}</span>;
        }
        if (/^"/.test(t)) return <span key={i} className="text-accent">{t}</span>;
        if (/^(true|false|null)$/.test(t)) return <span key={i} className="text-yellow-400">{t}</span>;
        if (/^-?\d/.test(t)) return <span key={i} className="text-orange-300">{t}</span>;
        return <span key={i}>{t}</span>;
      })}
    </code>
  );
}

function BashHighlight({ code, lang }: { code: string; lang: string }) {
  if (lang !== "bash") return <code>{code}</code>;
  const lines = code.split("\n");
  return (
    <code>
      {lines.map((line, i) => {
        const m = line.match(/^(\s*)(\S+)(.*)$/);
        if (!m) return <span key={i}>{line}{"\n"}</span>;
        const [, indent, cmd, rest] = m;
        const isCmd = !cmd.startsWith("-") && !cmd.startsWith("{") && !cmd.startsWith('"');
        return (
          <span key={i}>
            {indent}
            <span className={isCmd ? "text-limefg" : "text-sub"}>{cmd}</span>
            {rest}
            {i < lines.length - 1 ? "\n" : ""}
          </span>
        );
      })}
    </code>
  );
}
