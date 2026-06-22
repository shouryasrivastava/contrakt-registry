import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { signIn } from "@/lib/auth";
import { e2eEnabled } from "@/lib/e2e";
import GitHubSignInButton from "../components/GitHubSignInButton";
import BrandLogo from "../components/BrandLogo";

interface SignInPageProps {
  searchParams?: Promise<{ next?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  const params = (await searchParams) ?? {};
  const nextPath = params.next?.startsWith("/") ? params.next : "/dashboard";

  if (session?.user?.id) {
    redirect(nextPath);
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1040px] flex-col">
        <header className="nav-capsule flex items-center justify-between px-4 py-2.5">
          <Link href="/" className="flex items-center gap-3 text-[17px] font-semibold tracking-tight text-ink">
            <BrandLogo priority className="w-[104px]" />
          </Link>
          <Link href="/registry" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted hover:text-ink">
            Public Registry
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-8 py-14 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">Authentication required</p>
            <h1 className="max-w-2xl font-[family-name:var(--font-display)] text-[58px] leading-[0.94] tracking-[-0.02em] text-[#202020]">
              Sign in to manage this contract.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-[1.55] text-muted">
              The public registry and MCP configs are open to browse. Dashboards, tokens, integrations, and publishing tools are owner-only.
            </p>
          </div>

          <div className="soft-panel p-5">
            <div className="rounded-[12px] bg-[#f7f7f7] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">After sign-in</p>
              <p className="mt-2 break-all font-mono text-[13px] text-[#202020]">{nextPath}</p>
            </div>
            <div className="mt-5">
              <GitHubSignInButton nextPath={nextPath} />
            </div>
            {e2eEnabled() ? (
              <form
                className="mt-3"
                action={async (formData) => {
                  "use server";
                  await signIn("e2e", {
                    username: String(formData.get("username") ?? ""),
                    secret: String(formData.get("secret") ?? ""),
                    redirectTo: String(formData.get("next") ?? "/dashboard"),
                  });
                }}
              >
                <input type="hidden" name="next" value={nextPath} />
                <label className="block text-[11px] font-medium text-muted">
                  E2E username
                  <input
                    name="username"
                    required
                    className="mt-1 w-full rounded-[9px] border border-border px-3 py-2 text-ink"
                  />
                </label>
                <label className="mt-2 block text-[11px] font-medium text-muted">
                  E2E secret
                  <input
                    name="secret"
                    type="password"
                    required
                    className="mt-1 w-full rounded-[9px] border border-border px-3 py-2 text-ink"
                  />
                </label>
                <button
                  type="submit"
                  className="mt-3 w-full rounded-full bg-ink px-5 py-3 text-[14px] font-semibold text-white"
                >
                  Sign in for E2E
                </button>
              </form>
            ) : null}
            <Link
              href="/registry"
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-[14px] font-semibold text-[#202020] transition hover:bg-[#f7f7f7]"
            >
              Back to registry
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
