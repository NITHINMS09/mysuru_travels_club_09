'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineExternalLink, HiOutlinePlay, HiOutlineX, HiOutlineVideoCamera, HiOutlinePhotograph } from 'react-icons/hi';
import api from '@/lib/api';

export default function InstagramFeed() {
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'reels' | 'posts'>('all');
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const data = await api.instagram.getFeed();
        setFeed(data || []);
      } catch (err) {
        console.error('Failed to fetch Instagram feed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const filteredFeed = feed.filter(item => {
    const isReel = item.mediaType === 'VIDEO' && item.permalink.includes('/reel/');
    if (filter === 'reels') return isReel;
    if (filter === 'posts') return !isReel;
    return true;
  });

  if (loading) {
    return (
      <section className="py-20 bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </section>
    );
  }

  if (feed.length === 0) {
    return null; // Don't show the section if no feed is connected
  }

  return (
    <section className="py-20 sm:py-28 bg-[#fafafa] border-t border-slate-100 overflow-hidden text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
            Social Feed
          </span>
          <h2 className="text-3xl md:text-5xl font-black font-outfit uppercase tracking-tight text-slate-900">
            Latest Updates From Instagram
          </h2>
          <p className="text-slate-500 text-sm md:text-base font-medium">
            Follow us on Instagram <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-amber-600 font-bold hover:underline">@mysurutravels_insta</a> for live updates, scenic reels, and booking alerts.
          </p>

          {/* Filters */}
          <div className="flex justify-center gap-3 pt-6">
            {(['all', 'reels', 'posts'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
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
            {filteredFeed.map((item) => {
              const isReel = item.mediaType === 'VIDEO' && item.permalink.includes('/reel/');
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group relative bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 aspect-square cursor-pointer"
                  onClick={() => {
                    if (item.mediaType === 'VIDEO') {
                      setActiveVideo(item);
                      setIsPlaying(true);
                    } else {
                      window.open(item.permalink, '_blank');
                    }
                  }}
                >
                  {/* Media Display */}
                  <div className="w-full h-full relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={item.thumbnailUrl || item.mediaUrl} 
                      alt={item.caption || 'Instagram post'} 
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Media Type Badge */}
                    <div className="absolute top-4 right-4 bg-slate-900/60 backdrop-blur-md text-white p-2 rounded-full border border-white/10 z-10">
                      {isReel ? (
                        <HiOutlineVideoCamera className="w-4 h-4 text-amber-400" />
                      ) : item.mediaType === 'VIDEO' ? (
                        <HiOutlinePlay className="w-4 h-4" />
                      ) : (
                        <HiOutlinePhotograph className="w-4 h-4" />
                      )}
                    </div>

                    {/* Hover Info Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 space-y-3 z-10">
                      <p className="text-white text-xs line-clamp-3 font-medium leading-relaxed">
                        {item.caption || 'Explore the beauty of Mysuru with our guided adventures.'}
                      </p>
                      
                      <div className="flex justify-between items-center text-[10px] text-slate-350 font-bold uppercase tracking-wider">
                        <span>{new Date(item.timestamp).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                        <span className="flex items-center gap-1 text-white hover:text-amber-400 transition-colors">
                          {item.mediaType === 'VIDEO' ? 'Watch Now' : 'View Post'} <HiOutlineExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* LIGHTBOX MODAL: Play reels/videos directly */}
      <AnimatePresence>
        {activeVideo && (
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
                onClick={() => setActiveVideo(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>

              {/* Video Player */}
              <div className="md:w-3/5 aspect-video md:aspect-auto md:h-[70vh] bg-black relative flex items-center justify-center group/video">
                <video 
                  ref={videoRef}
                  src={activeVideo.mediaUrl}
                  poster={activeVideo.thumbnailUrl}
                  autoPlay
                  loop
                  playsInline
                  onClick={togglePlay}
                  className="w-full h-full object-contain cursor-pointer"
                />

                {/* Custom Video Controls overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/video:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                  <div className="flex gap-3">
                    <button 
                      onClick={togglePlay} 
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button 
                      onClick={toggleMute} 
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Video Info Details */}
              <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between space-y-6 h-full md:max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-slate-800 p-0.5">
                      <img 
                        src="https://cdn.corenexis.com/files/c/8845266721.png" 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <p className="font-black text-sm text-white">mysurutravels_insta</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {activeVideo.permalink.includes('/reel/') ? 'Instagram Reel' : 'Instagram Video'}
                      </p>
                    </div>
                  </div>

                  <p className="text-slate-350 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {activeVideo.caption || 'No caption available.'}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/10 space-y-4">
                  <div className="flex justify-between text-[10px] text-slate-450 font-bold uppercase tracking-widest">
                    <span>Posted Date</span>
                    <span>{new Date(activeVideo.timestamp).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  </div>

                  <a 
                    href={activeVideo.permalink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-white text-slate-900 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-all cursor-pointer shadow-md"
                  >
                    View on Instagram <HiOutlineExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
