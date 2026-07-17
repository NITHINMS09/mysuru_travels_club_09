export default function TripDetailLoading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Hero Banner Shimmer */}
      <div className="h-[50vh] sm:h-[60vh] w-full bg-slate-200 animate-pulse relative" />

      <div className="max-w-7xl mx-auto px-4 -mt-16 sm:-mt-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
          {/* Content Areas */}
          <div className="lg:col-span-2 space-y-8">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-6 w-28 bg-slate-150 rounded-lg animate-pulse" />
              </div>
              <div className="h-10 w-2/3 bg-slate-200 rounded-xl animate-pulse" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-96 rounded-3xl bg-slate-200 animate-pulse" />
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
              <div className="h-12 w-1/2 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-12 w-full bg-slate-200 rounded-xl animate-pulse" />
              <div className="h-12 w-full bg-slate-150 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
