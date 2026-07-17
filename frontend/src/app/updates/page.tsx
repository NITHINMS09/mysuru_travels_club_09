'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineVideoCamera, HiOutlinePhotograph, HiOutlineStar, 
  HiOutlineCalendar, HiOutlineExternalLink, HiOutlinePlay, HiOutlineX,
  HiOutlineSearch, HiOutlineChatAlt2, HiOutlineSpeakerphone
} from 'react-icons/hi';
import api from '@/lib/api';

// Helper to extract Youtube Shorts ID
function getYouTubeShortsId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper to extract Instagram Reel Shortcode
function getInstagramReelShortcode(url: string): string | null {
  const match = url.match(/(?:instagram\.com\/p\/|instagram\.com\/reel\/|instagram\.com\/tv\/)([a-zA-Z0-9__-]+)/);
  return match ? match[1] : null;
}

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeItem, setActiveItem] = useState<any | null>(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'reels' | 'videos' | 'announcements' | 'reviews' | 'trips'>('all');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 9;

  const loadData = async (pageNum: number, isLoadMore = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      // Map filter state to API filters
      const categoryFilter = activeFilter === 'all' ? undefined : activeFilter;
      const typeFilter = activeFilter === 'reels' ? 'REEL' : activeFilter === 'videos' ? 'VIDEO' : undefined;

      const res = await api.socialUpdates.getAll({
        category: categoryFilter,
        type: typeFilter,
        search: searchQuery || undefined,
        page: pageNum,
        limit: LIMIT
      });

      if (isLoadMore) {
        setUpdates(prev => [...prev, ...(res.updates || [])]);
      } else {
        setUpdates(res.updates || []);
      }

      setHasMore(res.pagination ? pageNum < res.pagination.totalPages : false);
    } catch (err) {
      console.error('Failed to load manual updates:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Reload when search query or filter changes
  useEffect(() => {
    setPage(1);
    loadData(1, false);
  }, [searchQuery, activeFilter]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(nextPage, true);
  };

  return (
    <div className="pt-24 sm:pt-28 pb-20 bg-[#f8fafc] min-h-screen text-slate-900 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner Area */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
            Realtime Updates
          </span>
          <h1 className="text-3xl sm:text-5xl font-black font-outfit uppercase tracking-tight text-slate-900">
            Updates & Announcements
          </h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium">
            Live reels, expedition launches, customer logs, and announcments synced directly from our team.
          </p>
        </div>

        {/* Filters and Search Panel */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white border border-slate-200/60 rounded-[2rem] p-6 shadow-sm mb-12">
          {/* Scrollable Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 shrink-0">
            {(['all', 'reels', 'videos', 'announcements', 'reviews', 'trips'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
                  activeFilter === cat
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-550 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search updates, reels, announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs outline-none focus:border-amber-400 focus:bg-white transition-all text-slate-800 font-semibold"
            />
          </div>
        </div>

        {/* Dynamic Updates Feed */}
        {loading && page === 1 ? (
          <div className="pt-24 pb-20 bg-transparent flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : updates.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200/60 rounded-3xl p-8 max-w-md mx-auto shadow-sm">
            <HiOutlineCalendar className="w-12 h-12 text-slate-350 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-slate-800 mb-1">No Updates Found</h3>
            <p className="text-xs text-slate-400">There are no updates matching your search filters. Check back soon for fresh scenic reels and trip rollouts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {updates.map((item) => {
              const ytId = getYouTubeShortsId(item.url);
              const instaShortcode = getInstagramReelShortcode(item.url);

              return (
                <div 
                  key={item.id} 
                  className="bg-white border border-slate-200/60 rounded-[2.25rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Media Banner */}
                  <div 
                    onClick={() => setActiveItem(item)}
                    className="relative w-full aspect-video bg-slate-100 overflow-hidden cursor-pointer group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={item.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=600&auto=format&fit=crop')} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
                    />
                    
                    {/* Media Type Badge Overlay */}
                    <div className="absolute top-4 right-4 bg-slate-900/70 backdrop-blur-sm text-white p-2 rounded-full border border-white/10 z-10">
                      {item.type === 'REEL' ? (
                        <HiOutlineVideoCamera className="w-4 h-4 text-amber-400" />
                      ) : item.type === 'VIDEO' ? (
                        <HiOutlinePlay className="w-4 h-4 text-rose-500" />
                      ) : item.type === 'REVIEW' ? (
                        <HiOutlineChatAlt2 className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <HiOutlineSpeakerphone className="w-4 h-4 text-green-400" />
                      )}
                    </div>

                    {(item.type === 'REEL' || item.type === 'VIDEO') && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
                        <div className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center text-slate-900 shadow-md group-hover:scale-110 transition-transform">
                          <HiOutlinePlay className="w-6 h-6 ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content Details */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-100 inline-block">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-slate-900 font-outfit leading-snug line-clamp-2">
                        {item.title}
                      </h3>

                      {item.type === 'REVIEW' && (
                        <div className="flex items-center gap-0.5 text-amber-500 py-1">
                          {[...Array(5)].map((_, i) => (
                            <HiOutlineStar key={i} className="w-3.5 h-3.5 fill-amber-500" />
                          ))}
                        </div>
                      )}

                      <p className="text-slate-450 text-xs sm:text-sm leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    {item.url && (
                      <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end">
                        <button 
                          onClick={() => setActiveItem(item)}
                          className="flex items-center gap-1 text-xs font-black text-slate-900 hover:text-amber-600 transition-colors"
                        >
                          {item.type === 'VIDEO' ? 'Watch Video' : item.type === 'REEL' ? 'Watch Reel' : 'View Post'} 
                          <HiOutlineExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Trigger */}
        {hasMore && (
          <div className="mt-12 text-center">
            <button 
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-md cursor-pointer"
            >
              {loadingMore ? 'Loading Updates...' : 'Load More Updates'}
            </button>
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL: Play reels/videos directly */}
      <AnimatePresence>
        {activeItem && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl w-full max-w-4xl border border-white/10 flex flex-col md:flex-row relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setActiveItem(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>

              {/* Video Player */}
              <div className="md:w-3/5 aspect-video md:aspect-auto md:h-[70vh] bg-black relative flex items-center justify-center group/video">
                {getYouTubeShortsId(activeItem.url) ? (
                  <iframe 
                    src={`https://www.youtube.com/embed/${getYouTubeShortsId(activeItem.url)}?autoplay=1`} 
                    className="w-full h-full border-0"
                    allow="autoplay; encrypted-media; picture-in-picture" 
                    allowFullScreen
                  />
                ) : getInstagramReelShortcode(activeItem.url) ? (
                  <iframe 
                    src={`https://www.instagram.com/p/${getInstagramReelShortcode(activeItem.url)}/embed/`} 
                    className="w-full h-full border-0 bg-white"
                    allowFullScreen
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={activeItem.thumbnailUrl || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=600&auto=format&fit=crop'} 
                    alt={activeItem.title} 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Video Details */}
              <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between space-y-6 h-full md:max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 bg-white/10 px-2.5 py-0.5 rounded border border-white/10 inline-block mb-2">
                      {activeItem.category}
                    </span>
                    <h3 className="font-black text-lg text-white font-outfit">{activeItem.title}</h3>
                  </div>

                  <p className="text-slate-350 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {activeItem.description || 'No description available.'}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/10 space-y-4">
                  <div className="flex justify-between text-[10px] text-slate-450 font-bold uppercase tracking-widest">
                    <span>Published On</span>
                    <span>{new Date(activeItem.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  </div>

                  {activeItem.url && (
                    <a 
                      href={activeItem.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-white text-slate-900 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      {activeItem.url.includes('youtube.com') ? 'Watch on YouTube' : activeItem.url.includes('instagram.com') ? 'Watch on Instagram' : 'View Source'}
                      <HiOutlineExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
