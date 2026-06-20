import type { ReactNode } from "react";

/**
 * The single pill style for the whole app.
 *   default → transparent, 1px border, uppercase micro text
 *   accent  → emerald text on a faint emerald tint (for "Paid" / "Accepting payments")
 */
export default function Pill({
  children,
  accent = false,
  title,
}: {
  children: ReactNode;
  accent?: boolean;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] uppercase tracking-wider " +
        (accent
          ? "text-accent bg-accent/10 border border-accent/25"
          : "text-muted border border-border bg-transparent")
      }
    >
      {children}
    </span>
  );
}
