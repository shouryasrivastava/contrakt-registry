import { FloatingNav, WorkspaceLayout } from "./WorkspaceChrome";
import { SkeletonBlock } from "./WorkspaceLoading";

function NavSkeleton({ active }: { active?: "apis" }) {
  return (
    <FloatingNav
      active={active}
      actions={
        <>
          <SkeletonBlock className="h-9 w-24 rounded-full" />
          <SkeletonBlock className="h-9 w-28 rounded-full" />
          <SkeletonBlock className="h-9 w-9 rounded-full" />
        </>
      }
    />
  );
}

export function RegistrySkeleton() {
  return (
    <div className="min-h-screen bg-background px-3 pb-10 pt-5 sm:px-5" aria-busy="true" aria-label="Loading registry">
      <NavSkeleton />
      <main className="pt-5">
        <WorkspaceLayout
          sidebar={
            <div className="min-h-[620px] space-y-4 px-4 py-6">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex items-center gap-3 px-3 py-2.5">
                  <SkeletonBlock className="h-4 w-4" />
                  <SkeletonBlock className="h-4 w-24" />
                </div>
              ))}
            </div>
          }
        >
          <div className="p-5 sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <SkeletonBlock className="h-10 w-64" />
                <SkeletonBlock className="mt-3 h-4 w-[520px] max-w-full" />
              </div>
              <SkeletonBlock className="h-9 w-28 rounded-full" />
            </div>
            <div className="mt-8 rounded-[12px] border border-border bg-white p-5">
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_0.7fr]">
                <SkeletonBlock className="h-14 w-full" />
                <SkeletonBlock className="h-14 w-full" />
                <SkeletonBlock className="h-14 w-full" />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {Array.from({ length: 7 }, (_, index) => (
                  <SkeletonBlock key={index} className="h-9 w-24 rounded-full" />
                ))}
              </div>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <SkeletonBlock key={index} className="h-[250px] w-full rounded-[12px]" />
              ))}
            </div>
          </div>
        </WorkspaceLayout>
      </main>
    </div>
  );
}

export function PublicContractSkeleton() {
  return (
    <div className="min-h-screen bg-background px-3 pb-14 pt-5 sm:px-5" aria-busy="true" aria-label="Loading contract">
      <NavSkeleton />
      <main className="mx-auto mt-5 w-full max-w-[1120px]">
        <section className="border-b border-border py-10">
          <SkeletonBlock className="h-5 w-36 rounded-full" />
          <SkeletonBlock className="mt-5 h-16 w-[520px] max-w-full" />
          <SkeletonBlock className="mt-5 h-4 w-[680px] max-w-full" />
          <SkeletonBlock className="mt-2 h-4 w-[560px] max-w-full" />
        </section>
        <div className="grid gap-8 py-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
          <div className="space-y-3">
            <SkeletonBlock className="h-9 w-40" />
            {Array.from({ length: 5 }, (_, index) => (
              <SkeletonBlock key={index} className="h-16 w-full rounded-[10px]" />
            ))}
          </div>
          <div className="space-y-4">
            <SkeletonBlock className="h-56 w-full rounded-[12px]" />
            <SkeletonBlock className="h-32 w-full rounded-[12px]" />
            <SkeletonBlock className="h-48 w-full rounded-[12px]" />
          </div>
        </div>
      </main>
    </div>
  );
}
