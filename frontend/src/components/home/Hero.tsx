'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { HiOutlineArrowRight, HiOutlinePlay } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useRef, useState, useEffect } from 'react';
import VideoModal from '@/components/shared/VideoModal';



export default function Hero() {
  const ref = useRef(null);
  const [settings, setSettings] = useState<any>({});
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  useEffect(() => {
    import('@/lib/api').then(({ default: api }) => {
      api.settings.getAll().then(setSettings).catch(console.error);
    });
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  // Parallax effects
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const yText = useTransform(scrollYProgress, [0, 1], ['0%', '45%']);
  const opacityText = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const titleWords = ["Journey", "Beyond", "Your", "Imagination"];

  return (
    <>
      <section ref={ref} className="relative h-screen w-full overflow-hidden bg-slate-50 perspective-[1000px]">
        {/* Cinematic Mountain Landscape Background with Parallax */}
        <motion.div style={{ y: yBg }} className="absolute inset-0 z-0 origin-top">
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/70 to-slate-50 z-10 backdrop-blur-[2px]" />
          <img
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2560"
            alt="Cinematic Landscape"
            className="h-[120%] w-full object-cover -translate-y-[10%] opacity-90 object-center"
          />
        </motion.div>

        {/* Floating Glowing Accents */}
        <div className="absolute top-[20%] left-[5%] w-[450px] max-w-[80vw] h-[450px] bg-primary-400/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[5%] w-[500px] max-w-[80vw] h-[500px] bg-accent-cyan/15 rounded-full blur-[140px] pointer-events-none" />

        {/* Content */}
        <motion.div 
          style={{ y: yText, opacity: opacityText }}
          className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4 md:px-8 mt-12"
        >
          <div className="max-w-6xl w-full flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-block px-6 py-2.5 mb-8 text-xs font-bold tracking-[0.3em] uppercase bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-full text-slate-800 shadow-sm shadow-slate-200/50">
                {settings.heroTagline || "Explore the Extraordinary"}
              </span>
            </motion.div>
            
            <h1 
              className="text-4xl sm:text-5xl md:text-7xl lg:text-[7.5rem] font-bold mb-8 leading-[1.05] tracking-tight flex flex-wrap justify-center gap-x-3 md:gap-x-5 gap-y-2 md:gap-y-3 font-outfit"
            >
              {titleWords.map((word, i) => (
                <span 
                  key={i} 
                  className="inline-block text-[#FFFFFF]"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                >
                  {word}
                </span>
              ))}
            </h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1, ease: "easeOut" }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-700 font-medium mb-12 max-w-3xl mx-auto font-inter leading-relaxed drop-shadow-sm"
            >
              Experience the world's most breathtaking destinations with our curated premium adventures. 
              AI-powered planning meets human-centric exploration.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full"
            >
              <Link href="/trips" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(139,92,246,0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center gap-3 w-full text-lg font-bold py-4 px-10 rounded-2xl bg-slate-950 text-white hover:bg-primary-700 transition-all duration-300 shadow-xl"
                >
                  Start Exploring
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    <HiOutlineArrowRight className="w-6 h-6" />
                  </motion.div>
                </motion.button>
              </Link>
              
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(148,163,184,0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (settings.filmVideoUrl) {
                    setIsVideoOpen(true);
                  } else {
                    toast.error('No film URL configured in admin panel');
                  }
                }}
                className="flex items-center justify-center gap-4 w-full sm:w-auto px-10 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold hover:bg-slate-50 transition-all duration-300 shadow-xl shadow-slate-200/50 group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center pl-1 shadow-inner group-hover:bg-slate-200 transition-colors">
                  <HiOutlinePlay className="w-5 h-5 text-slate-800" />
                </div>
                Watch Film
              </motion.button>
            </motion.div>

            {/* Trust Signals */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="mt-20 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 lg:gap-16"
            >
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100"
                  ].map((url, index) => (
                    <img key={index} src={url} alt="User" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" />
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex text-amber-500 text-sm font-bold leading-none mb-1">★ ★ ★ ★ ★</div>
                  <span className="text-[11px] text-slate-600 font-bold uppercase tracking-widest">Loved by 10k+ Explorers</span>
                </div>
              </div>
              <div className="h-px w-16 bg-slate-200 md:h-10 md:w-px" />
              <div className="flex items-center gap-8 text-slate-500 text-xs font-semibold tracking-[0.2em] uppercase">
                <span className="text-slate-400">Featured in</span>
                <span className="font-extrabold text-slate-800 tracking-wider">Lonely Planet</span>
                <span className="font-extrabold text-slate-800 tracking-wider">Nat Geo</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Floating Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-4"
        >
          <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-extrabold rotate-90 translate-x-[2px] mb-10">Scroll</span>
          <div className="w-[2px] h-24 bg-slate-200 relative overflow-hidden rounded-full">
            <motion.div 
              animate={{ y: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
              className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-primary-500 to-transparent" 
            />
          </div>
        </motion.div>
      </section>

      <VideoModal 
        isOpen={isVideoOpen} 
        onClose={() => setIsVideoOpen(false)} 
        videoUrl={settings.filmVideoUrl} 
      />
    </>
  );
}
