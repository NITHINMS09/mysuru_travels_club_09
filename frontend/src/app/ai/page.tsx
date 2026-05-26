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
    <div className="pt-24 pb-20 bg-[#050816] min-h-screen">
      <div className="max-w-4xl mx-auto px-4">

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
            className="text-4xl md:text-5xl font-black mb-4"
          >
            Travel <span className="gradient-text">Search</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/40 max-w-xl mx-auto"
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
              <div className="relative flex items-center bg-white/[0.05] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                <HiOutlineSearch className="w-6 h-6 text-white/30 ml-5 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Search destinations, tips, hotels... (e.g. "Best time to visit Manali")'
                  className="flex-1 bg-transparent text-white text-lg px-4 py-5 outline-none placeholder:text-white/25"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="mr-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl text-white font-bold flex items-center gap-2 hover:from-primary-500 hover:to-primary-400 disabled:opacity-30 transition-all duration-300 shrink-0"
                >
                  <HiOutlineSearch className="w-5 h-5" />
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* Powered badge */}
          <div className="flex items-center justify-center gap-2 mt-3 text-white/20 text-xs">
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
            <h3 className="text-center text-sm font-bold text-white/20 uppercase tracking-[0.2em] mb-5">Popular Searches</h3>
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
                  className="px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-white/60 hover:text-white hover:bg-white/[0.08] hover:border-primary-500/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(108,43,217,0.15)]"
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
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-6" />
              <p className="text-white/40 font-medium animate-pulse">Searching the web...</p>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white/70">
                {results.length > 0
                  ? `Found ${results.length} results for "${query}"`
                  : `No results found for "${query}"`
                }
              </h2>
              <button
                onClick={() => { setSearched(false); setResults([]); setQuery(''); }}
                className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
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
                  className="block group p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-primary-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(108,43,217,0.1)]"
                >
                  {/* Source */}
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${result.source}&sz=32`}
                      alt=""
                      className="w-4 h-4 rounded-sm"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="text-xs text-white/30 truncate">{result.source}</span>
                    <HiOutlineExternalLink className="w-3 h-3 text-white/20 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-primary-400 group-hover:text-primary-300 transition-colors mb-1.5 line-clamp-2">
                    {result.title}
                  </h3>

                  {/* Snippet */}
                  {result.snippet && (
                    <p className="text-sm text-white/40 line-clamp-2 leading-relaxed">
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
                  className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-primary-400 transition-colors"
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
            <div className="w-24 h-24 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
              <HiOutlineSparkles className="w-10 h-10 text-white/10" />
            </div>
            <h3 className="text-xl font-bold text-white/15 mb-2">Search the World</h3>
            <p className="text-white/10 text-sm">Type a destination or question above to get started</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
