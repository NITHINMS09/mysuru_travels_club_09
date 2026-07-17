export default function TripsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 pt-24 sm:pt-28 pb-16 min-h-screen bg-[#f8fafc]">
      <div className="h-10 w-48 bg-slate-200 rounded-xl mb-4 animate-pulse" />
      <div className="h-6 w-96 bg-slate-100 rounded-lg mb-12 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-[480px] rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden flex flex-col"
          >
            <div className="h-64 bg-slate-200/80 animate-pulse w-full" />
            <div className="p-6 flex-grow flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-4 w-24 bg-slate-150 rounded-lg animate-pulse" />
                <div className="h-6 w-3/4 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-4 w-5/6 bg-slate-100 rounded-lg animate-pulse" />
              </div>
              <div className="flex items-center justify-between mt-6">
                <div className="h-8 w-20 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-10 w-28 bg-slate-200 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
