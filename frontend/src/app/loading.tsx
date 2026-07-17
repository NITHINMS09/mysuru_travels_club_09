export default function Loading() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4 bg-[#0B0F19]">
      <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      <p className="text-zinc-500 text-sm font-medium tracking-wide">Loading expedition details...</p>
    </div>
  );
}
