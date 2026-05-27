'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineSearch, HiOutlineGlobeAlt, HiOutlineSparkles,
  HiOutlineExternalLink, HiOutlineArrowRight
} from 'react-icons/hi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

const travelCategories = [
  { label: '🏖️ Beaches', query: 'best beach destinations India' },
  { label: '🏔️ Mountains', query: 'best mountain treks India' },
  { label: '🏛️ Heritage', query: 'UNESCO heritage sites India' },
  { label: '🦁 Wildlife', query: 'best wildlife safari India' },
  { label: '💰 Budget', query: 'budget travel tips India' },
  { label: '✨ Luxury', query: 'luxury resort destinations India' },
  { label: '🎒 Backpacking', query: 'backpacking destinations India' },
  { label: '🍜 Food Tours', query: 'best food tour destinations India' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q) return;

    setQuery(q);
    setLoading(true);
    setSearched(true);
    setResults([]);

    try {
      const data = await api.ai.search(q);
      setResults(data.results || []);
    } catch (err: any) {
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="pt-20 sm:pt-24 pb-12 sm:pb-20 bg-[#f8fafc] min-h-screen text-slate-900 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 w-full">

        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center mx-auto mb-6 shadow-glow"
          >
            <HiOutlineGlobeAlt className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 font-outfit"
          >
            Travel <span className="gradient-text">Search</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 max-w-xl mx-auto font-inter"
          >
            Search anything travel-related — destinations, hotels, guides, tips & more.
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <form onSubmit={handleSubmit}>
            <div className="relative group">
              <div className="absolute -inset-[2px] bg-gradient-to-r from-primary-500 via-accent-cyan to-primary-500 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />
              <div className="relative flex items-center bg-white border border-slate-200 shadow-md rounded-2xl overflow-hidden backdrop-blur-xl">
                <HiOutlineSearch className="w-6 h-6 text-slate-400 ml-5 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Search destinations, tips, hotels... (e.g. "Best time to visit Manali")'
                  className="flex-1 bg-transparent text-slate-900 text-base sm:text-lg px-3 sm:px-4 py-4 sm:py-5 outline-none placeholder:text-slate-400 min-w-0"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="mr-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl text-white font-bold flex items-center gap-2 hover:from-primary-500 hover:to-primary-400 disabled:opacity-30 transition-all duration-300 shrink-0 cursor-pointer"
                >
                  <HiOutlineSearch className="w-5 h-5 text-white" />
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* Powered badge */}
          <div className="flex items-center justify-center gap-2 mt-3 text-slate-400 text-xs font-medium">
            <HiOutlineGlobeAlt className="w-3.5 h-3.5" />
            <span>Powered by Web Search</span>
          </div>
        </motion.div>

        {/* Quick Category Cards */}
        {!searched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <h3 className="text-center text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-5 font-outfit">Popular Searches</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {travelCategories.map((cat, i) => (
                <motion.button
                  key={cat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  onClick={() => {
                    setQuery(cat.query);
                    handleSearch(cat.query);
                  }}
                  className="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-sm text-slate-600 hover:text-primary-600 hover:bg-slate-50 hover:border-primary-500/30 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                >
                  {cat.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-6" />
              <p className="text-slate-500 font-medium animate-pulse">Searching the web...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Results */}
        {!loading && searched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Results Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-lg font-bold text-slate-700">
                {results.length > 0
                  ? `Found ${results.length} results for "${query}"`
                  : `No results found for "${query}"`
                }
              </h2>
              <button
                onClick={() => { setSearched(false); setResults([]); setQuery(''); }}
                className="text-xs text-primary-600 hover:text-primary-500 transition-colors font-bold cursor-pointer"
              >
                Clear
              </button>
            </div>

            {/* Results List */}
            <div className="space-y-4">
              {results.map((result, i) => (
                <motion.a
                  key={i}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="block group p-5 rounded-2xl bg-white border border-slate-100 hover:border-primary-500/20 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 shadow-sm"
                >
                  {/* Source */}
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${result.source}&sz=32`}
                      alt=""
                      className="w-4 h-4 rounded-sm"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="text-xs text-slate-400 truncate">{result.source}</span>
                    <HiOutlineExternalLink className="w-3 h-3 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-primary-600 group-hover:text-primary-700 transition-colors mb-1.5 line-clamp-2">
                    {result.title}
                  </h3>

                  {/* Snippet */}
                  {result.snippet && (
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {result.snippet}
                    </p>
                  )}
                </motion.a>
              ))}
            </div>

            {/* Search Again Prompt */}
            {results.length > 0 && (
              <div className="text-center mt-8">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(query + ' travel')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-primary-600 transition-colors font-semibold"
                >
                  See more on Google
                  <HiOutlineArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </motion.div>
        )}

        {/* Empty State - Before Search */}
        {!searched && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 rounded-3xl bg-slate-100 border border-slate-200/60 flex items-center justify-center mx-auto mb-6">
              <HiOutlineSparkles className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-300 mb-2 font-outfit">Search the World</h3>
            <p className="text-slate-400 text-sm">Type a destination or question above to get started</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
