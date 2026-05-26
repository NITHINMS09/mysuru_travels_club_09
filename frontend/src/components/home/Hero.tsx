'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { HiOutlineArrowRight, HiOutlinePlay } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useRef, useState, useEffect } from 'react';
import VideoModal from '@/components/shared/VideoModal';

// Word stagger animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const wordVariants = {
  hidden: { opacity: 0, y: 50, rotateX: -30 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: "spring",
      damping: 12,
      stiffness: 100,
    },
  },
};

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
  const yVideo = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const yText = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacityText = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const titleWords = ["Journey", "Beyond", "Your", "Imagination"];

  return (
    <>
      <section ref={ref} className="relative h-screen w-full overflow-hidden bg-black perspective-[1000px]">
        {/* Parallax Video Background */}
        <motion.div style={{ y: yVideo }} className="absolute inset-0 z-0 origin-top">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-zinc-950 z-10" />
          <video
            autoPlay
            loop
            muted
            playsInline
            key={settings.heroVideoUrl}
            className="h-[120%] w-full object-cover -translate-y-[10%]"
          >
            <source src={settings.heroVideoUrl || "/videos/hero-bg.mp4"} type="video/mp4" />
          </video>
        </motion.div>

        {/* Content */}
        <motion.div 
          style={{ y: yText, opacity: opacityText }}
          className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4 md:px-8"
        >
          <div className="max-w-5xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-block px-5 py-2 mb-8 text-xs font-bold tracking-[0.3em] uppercase bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-accent-gold shadow-glow">
                {settings.heroTagline || "Explore the Extraordinary"}
              </span>
            </motion.div>
            
            <motion.h1 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 leading-[1.05] tracking-tighter flex flex-wrap justify-center gap-x-4 gap-y-2"
            >
              {titleWords.map((word, i) => (
                <motion.span 
                  key={i} 
                  variants={wordVariants}
                  className={i >= 2 ? "gradient-text inline-block" : "inline-block text-white"}
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1, ease: "easeOut" }}
              className="text-lg md:text-2xl text-white/70 mb-12 max-w-3xl mx-auto font-inter leading-relaxed"
            >
              Experience the world's most breathtaking destinations with our curated premium adventures. 
              AI-powered planning meets human-centric exploration.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Link href="/trips">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary flex items-center justify-center gap-3 w-full sm:w-auto text-lg py-4 px-8 shadow-glow-lg"
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
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (settings.filmVideoUrl) {
                    setIsVideoOpen(true);
                  } else {
                    toast.error('No film URL configured in admin panel');
                  }
                }}
                className="flex items-center justify-center gap-4 w-full sm:w-auto px-8 py-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-md text-white font-bold transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center pl-1 shadow-glow">
                  <HiOutlinePlay className="w-5 h-5" />
                </div>
                Watch Film
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Floating Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-4"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold rotate-90 translate-x-[2px] mb-8">Scroll</span>
          <div className="w-[1px] h-24 bg-white/10 relative overflow-hidden rounded-full">
            <motion.div 
              animate={{ y: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-white to-transparent" 
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
