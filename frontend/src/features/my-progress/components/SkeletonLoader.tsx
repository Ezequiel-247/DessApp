export function SkeletonLoader() {
  return (
    <div className="flex flex-col gap-gutter pb-24 md:pb-8">
      <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
        <div className="xl:col-span-8 space-y-4">
          <div className="h-5 w-48 bg-slate-200 rounded animate-pulse px-1" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden animate-pulse"
            >
              <div className="flex items-center gap-4 p-5">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0" />
                <div className="h-5 w-24 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>

        <div className="xl:col-span-4 space-y-gutter">
          <div className="h-5 w-36 bg-slate-200 rounded animate-pulse px-1" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-100 animate-pulse"
              >
                <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-24 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
