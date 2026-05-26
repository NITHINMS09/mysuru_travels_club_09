'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Only show preloader on initial visit per session
    const hasVisited = sessionStorage.getItem('tripnova_visited');
    if (hasVisited) {
      setIsLoading(false);
      return;
    }

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 5;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsLoading(false);
          sessionStorage.setItem('tripnova_visited', 'true');
        }, 800);
      }
      setProgress(currentProgress);
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: '-100%' }}
          transition={{ duration: 0.95, ease: [0.76, 0, 0.24, 1], delay: 0.15 }}
          className="fixed inset-0 z-[99999] bg-[#ffffff] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Animated Background Blob */}
          <div className="absolute w-[450px] h-[450px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />

          {/* Logo Animation */}
          <div className="overflow-hidden mb-8 relative z-10">
            <motion.h1 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 tracking-tight text-center font-outfit"
            >
              MYSURU TRAVEL CLUB
            </motion.h1>
          </div>

          {/* Progress Bar Container */}
          <div className="w-64 md:w-96 h-[2px] bg-slate-100 relative overflow-hidden rounded-full z-10 shadow-sm">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.2 }}
            />
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-[10px] font-extrabold text-slate-400 tracking-[0.3em] uppercase z-10 font-outfit"
          >
            {progress}%
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
