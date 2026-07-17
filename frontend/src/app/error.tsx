'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Next.js Runtime Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] gap-6 px-6 text-center bg-[#0B0F19] text-white">
      <div className="text-5xl">⚠️</div>
      <h2 className="text-2xl font-black font-outfit text-slate-100">Something went wrong</h2>
      <p className="text-slate-400 text-sm max-w-md leading-relaxed">
        {error?.message || 'An unexpected runtime error occurred while loading this page. Please try reloading or check back shortly.'}
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 hover:shadow-purple-500/30 transition-all duration-200 active:scale-95 cursor-pointer text-sm"
      >
        Try Again
      </button>
    </div>
  );
}
