export default function Loading() {
  return (
    <div className="fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-transparent">
      <div className="h-full w-1/3 animate-[routeProgress_0.9s_ease-in-out_infinite] rounded-r-full bg-accent" />
    </div>
  );
}
