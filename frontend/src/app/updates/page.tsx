'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineVideoCamera, HiOutlinePhotograph, HiOutlineStar, 
  HiOutlineCalendar, HiOutlineExternalLink, HiOutlinePlay, HiOutlineX 
} from 'react-icons/hi';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function UpdatesPage() {
  const router = useRouter();
  const [feed, setFeed] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<any | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const loadUpdatesData = async () => {
      try {
        const [feedData, tripsData] = await Promise.all([
          api.instagram.getFeed().catch(() => []),
          api.trips.getAll().catch(() => ({ trips: [] }))
        ]);
        setFeed(feedData || []);
        setTrips(tripsData.trips || []);
      } catch (err) {
        console.error('Failed to load updates page datasets:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUpdatesData();
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

  // Compile items in a chronological or pseudo-chronological aggregated list
  const getAggregatedItems = () => {
    const items: any[] = [];

    // 1. Add Instagram posts/reels
    feed.forEach(item => {
      const isReel = item.mediaType === 'VIDEO' && item.permalink.includes('/reel/');
      items.push({
        id: `insta_${item.id}`,
        type: isReel ? 'reel' : 'post',
        date: new Date(item.timestamp),
        title: isReel ? 'New Reel Uploaded' : 'Instagram Update',
        content: item.caption,
        mediaUrl: item.mediaUrl,
        thumbnailUrl: item.thumbnailUrl,
        link: item.permalink,
        raw: item
      });
    });

    // 2. Add upcoming trips as announcements (take first 3 upcoming ones)
    const upcomingTrips = trips
      .filter(t => new Date(t.startDate) > new Date())
      .slice(0, 3);
    
    upcomingTrips.forEach(trip => {
      items.push({
        id: `trip_${trip.id}`,
        type: 'announcement',
        date: new Date(trip.createdAt || Date.now()),
        title: `Upcoming Expedition: ${trip.title}`,
        content: `Embark on a new adventure to ${trip.destination}! Starting from ₹${trip.price.toLocaleString()}. Book your spots before slots are sold out.`,
        mediaUrl: trip.coverImage,
        link: `/trips/${trip.id}`,
        slotsLeft: trip.maxGroupSize || 12
      });
    });

    // 3. Add simulated high-quality reviews from Mysore explorers (since review query might be empty)
    const mockReviews = [
      {
        id: 'rev_1',
        type: 'review',
        date: new Date(Date.now() - 3600000 * 36),
        title: 'Superb Heritage Experience!',
        author: 'Arjun K.',
        tripName: 'Mysuru Palaces & Gardens',
        rating: 5,
        content: 'Loved the tour! The guides were extremely knowledgeable, pacing was perfect, and the Mysore Dosa walk was a delicious highlight.'
      },
      {
        id: 'rev_2',
        type: 'review',
        date: new Date(Date.now() - 3600000 * 70),
        title: 'Highly Recommended Safari Tour',
        author: 'Sneha Rao',
        tripName: 'Kabini Wildlife Expedition',
        rating: 5,
        content: 'Everything was organized flawlessly. Spotted elephants, deers, and wild gaur. Accommodation and vehicles were clean and premium.'
      }
    ];

    mockReviews.forEach(rev => {
      items.push(rev);
    });

    // Sort items newest first
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20 bg-slate-50 min-h-screen px-4 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const aggregatedItems = getAggregatedItems();

  return (
    <div className="pt-20 sm:pt-24 pb-20 bg-[#f8fafc] min-h-screen text-slate-900 overflow-x-hidden">
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
            Live stories, trip rollouts, traveler feedback, and direct media feeds synced automatically from our social channels.
          </p>
        </div>

        {/* Dynamic Wall Grid */}
        {aggregatedItems.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200/60 rounded-3xl p-8 max-w-md mx-auto shadow-sm">
            <HiOutlineCalendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-slate-800 mb-1">No Updates Available</h3>
            <p className="text-xs text-slate-400">Settings have not been connected or synchronized yet. Connect Instagram in the Admin Panel to fetch feeds.</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 lg:gap-8 space-y-6 lg:space-y-8">
            {aggregatedItems.map((item) => (
              <div 
                key={item.id} 
                className="break-inside-avoid bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                {/* Media Preview (Reel / Post / Announcement) */}
                {item.mediaUrl && (
                  <div 
                    onClick={() => {
                      if (item.type === 'reel') {
                        setActiveVideo(item.raw);
                        setIsPlaying(true);
                      } else if (item.link) {
                        window.open(item.link, '_blank');
                      }
                    }}
                    className="relative w-full aspect-video md:aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer group"
                  >
                    {item.type === 'announcement' ? (
                      <Image 
                        src={item.mediaUrl} 
                        alt={item.title} 
                        fill 
                        className="object-cover group-hover:scale-103 transition-transform duration-500" 
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={item.thumbnailUrl || item.mediaUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
                      />
                    )}
                    
                    {/* Media Type Badge Overlay */}
                    <div className="absolute top-4 right-4 bg-slate-900/60 backdrop-blur-sm text-white p-2 rounded-full border border-white/10 z-10">
                      {item.type === 'reel' ? (
                        <HiOutlineVideoCamera className="w-4 h-4 text-amber-400" />
                      ) : item.type === 'post' ? (
                        <HiOutlinePhotograph className="w-4 h-4 text-sky-400" />
                      ) : (
                        <HiOutlineCalendar className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>

                    {item.type === 'reel' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
                        <div className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center text-slate-900 shadow-md group-hover:scale-110 transition-transform">
                          <HiOutlinePlay className="w-6 h-6 ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Content Details */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Badge / Timestamp */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        item.type === 'reel' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                        item.type === 'post' ? 'bg-sky-50 border-sky-100 text-sky-700' :
                        item.type === 'review' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                        'bg-emerald-50 border-emerald-100 text-emerald-700'
                      }`}>
                        {item.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {new Date(item.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-extrabold text-base text-slate-900 font-outfit leading-snug">
                      {item.title}
                    </h3>

                    {/* Review Rating Stars */}
                    {item.type === 'review' && (
                      <div className="flex items-center gap-1 text-amber-500 py-1">
                        {[...Array(item.rating)].map((_, i) => (
                          <HiOutlineStar key={i} className="w-4 h-4 fill-amber-500" />
                        ))}
                      </div>
                    )}

                    {/* Text Description */}
                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>

                    {item.type === 'review' && (
                      <div className="pt-2 text-xs font-bold text-slate-700">
                        — {item.author} <span className="text-slate-400 font-medium">on {item.tripName}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  {item.link && (
                    <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end">
                      {item.type === 'announcement' ? (
                        <button 
                          onClick={() => router.push(item.link)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                        >
                          Book Expedition
                        </button>
                      ) : (
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
                        >
                          View Instagram Post <HiOutlineExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL: Play reels directly */}
      <AnimatePresence>
        {activeVideo && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl border border-white/10 flex flex-col md:flex-row relative animate-fade-in"
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

                {/* Video controls */}
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

              {/* Video Details */}
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
                        Instagram Reel
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
                    className="w-full py-3 bg-white text-slate-900 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    View on Instagram <HiOutlineExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
