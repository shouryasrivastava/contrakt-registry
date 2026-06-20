import { FloatingNav, WorkspaceLayout } from "./WorkspaceChrome";

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-[8px] bg-[#dfdfdf] ${className}`} />;
}

export default function WorkspaceLoading({
  cards = 4,
  rows = 4,
}: {
  cards?: number;
  rows?: number;
}) {
  return (
    <div className="min-h-screen bg-background px-3 pb-10 pt-5 sm:px-5" aria-busy="true" aria-label="Loading page">
      <FloatingNav
        active="apis"
        actions={
          <>
            <SkeletonBlock className="h-9 w-24 rounded-full" />
            <SkeletonBlock className="h-9 w-28 rounded-full" />
            <SkeletonBlock className="h-8 w-8 rounded-full" />
          </>
        }
      />

      <main className="pt-5">
        <WorkspaceLayout
          sidebar={
            <div className="flex min-h-[620px] flex-col px-4 py-5">
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="flex items-center gap-3 px-3.5 py-2.5">
                    <SkeletonBlock className="h-4 w-4" />
                    <SkeletonBlock className={`h-4 ${index === 2 ? "w-28" : "w-20"}`} />
                  </div>
                ))}
              </div>
              <div className="mt-auto space-y-3 border-t border-border pt-5">
                <SkeletonBlock className="h-9 w-full" />
                <SkeletonBlock className="h-9 w-4/5" />
              </div>
            </div>
          }
        >
          <div className="p-5 sm:p-7">
            <div className="border-b border-border pb-6">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="mt-3 h-9 w-72 max-w-full" />
              <SkeletonBlock className="mt-3 h-4 w-[430px] max-w-full" />
            </div>

            <div className={`mt-6 grid gap-3 sm:grid-cols-2 ${cards === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
              {Array.from({ length: cards }, (_, index) => (
                <div key={index} className="rounded-[12px] border border-border bg-white p-4">
                  <div className="flex justify-between">
                    <SkeletonBlock className="h-9 w-9" />
                    <SkeletonBlock className="h-3 w-20" />
                  </div>
                  <SkeletonBlock className="mt-6 h-8 w-2/3" />
                  <SkeletonBlock className="mt-3 h-3 w-4/5" />
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-[12px] border border-border bg-white">
              <div className="border-b border-border px-5 py-4">
                <SkeletonBlock className="h-6 w-44" />
                <SkeletonBlock className="mt-2 h-3 w-72 max-w-full" />
              </div>
              <div className="divide-y divide-border">
                {Array.from({ length: rows }, (_, index) => (
                  <div key={index} className="grid gap-4 px-5 py-4 md:grid-cols-[1.4fr_0.6fr_0.6fr_auto]">
                    <div>
                      <SkeletonBlock className="h-4 w-44 max-w-full" />
                      <SkeletonBlock className="mt-2 h-3 w-28" />
                    </div>
                    <SkeletonBlock className="h-4 w-20" />
                    <SkeletonBlock className="h-4 w-24" />
                    <SkeletonBlock className="h-7 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </WorkspaceLayout>
      </main>
    </div>
  );
}
