import { redirect } from "next/navigation";
import type { Session } from "next-auth";

export function signInPath(next: string): string {
  return `/sign-in?next=${encodeURIComponent(next)}`;
}

export function requireSession(session: Session | null, next: string): asserts session is Session {
  if (!session?.user?.id) {
    redirect(signInPath(next));
  }
}

export function requireOwner(session: Session, ownerId: string, fallback: string): void {
  if (session.user.id !== ownerId) {
    redirect(fallback);
  }
}
