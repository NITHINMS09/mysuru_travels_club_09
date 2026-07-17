'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineExternalLink, HiOutlinePlay, HiOutlineX, HiOutlineVideoCamera, HiOutlineChatAlt2, HiOutlineSpeakerphone } from 'react-icons/hi';
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

export default function LatestUpdatesFeed() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [filter, setFilter] = useState<'all' | 'reels' | 'videos' | 'announcements' | 'reviews'>('all');

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const res = await api.socialUpdates.getAll({ limit: 12 });
        setUpdates(res.updates || []);
      } catch (err) {
        console.error('Failed to fetch social updates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUpdates();
  }, []);

  const filteredUpdates = updates.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'reels') return item.type === 'REEL';
    if (filter === 'videos') return item.type === 'VIDEO';
    if (filter === 'announcements') return item.category === 'announcements';
    if (filter === 'reviews') return item.category === 'reviews';
    return true;
  });

  if (loading) {
    return (
      <section className="py-20 bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </section>
    );
  }

  if (updates.length === 0) {
    return null; // Suppress rendering if empty
  }

  return (
    <section className="py-20 sm:py-28 bg-[#fafafa] border-t border-slate-100 overflow-hidden text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
            Latest News & Media
          </span>
          <h2 className="text-3xl md:text-5xl font-black font-outfit uppercase tracking-tight text-slate-900">
            Latest Updates & Feed
          </h2>
          <p className="text-slate-500 text-sm md:text-base font-medium">
            Explore our scenic reels, trip announcements, customer reviews, and adventure logs directly from the team.
          </p>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-2 pt-6">
            {(['all', 'reels', 'videos', 'announcements', 'reviews'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                  filter === type
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {type === 'all' ? 'All Updates' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Media Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredUpdates.map((item) => {
              const ytId = getYouTubeShortsId(item.url);
              const instaShortcode = getInstagramReelShortcode(item.url);
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group relative bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  onClick={() => setActiveItem(item)}
                >
                  <div className="relative aspect-video bg-slate-100 overflow-hidden cursor-pointer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={item.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=600&auto=format&fit=crop')} 
                      alt={item.title} 
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge Overlay */}
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
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-100 inline-block">
                        {item.category}
                      </span>
                      <h3 className="font-extrabold text-base text-slate-800 group-hover:text-amber-600 transition-colors line-clamp-1">{item.title}</h3>
                      <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">{item.description}</p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-3 border-t border-slate-100">
                      <span>{new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                      <button className="flex items-center gap-1.5 text-slate-800 hover:text-amber-600 transition-all font-black">
                        {item.type === 'VIDEO' ? 'Watch Video' : item.type === 'REEL' ? 'Watch Reel' : 'View Update'}
                        <HiOutlineExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* LIGHTBOX MODAL: Play reels/videos/details directly */}
      <AnimatePresence>
        {activeItem && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl border border-white/10 flex flex-col md:flex-row relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setActiveItem(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>

              {/* Video Player or Image Preview */}
              <div className="md:w-3/5 aspect-video md:aspect-auto md:h-[70vh] bg-black relative flex items-center justify-center">
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

              {/* Info Details */}
              <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between space-y-6 h-full md:max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 bg-white/10 px-2.5 py-0.5 rounded border border-white/10 inline-block mb-2">
                      {activeItem.category}
                    </span>
                    <h3 className="font-black text-lg text-white font-outfit">{activeItem.title}</h3>
                  </div>

                  <p className="text-slate-350 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {activeItem.description || 'No description available for this updates.'}
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
                      className="w-full py-3 bg-white text-slate-900 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-all cursor-pointer shadow-md"
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
    </section>
  );
}
