'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { HiOutlineChevronUp, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';

export default function FloatingWidgets() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Framer Motion Scroll Progress
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    // Scroll listener for back-to-top button visibility
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Initial Dark mode check
    const savedTheme = localStorage.getItem('tripnova_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('tripnova_theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('tripnova_theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {/* Scroll Progress Bar at the top of the viewport */}
      <motion.div className="scroll-progress-bar" style={{ scaleX }} />

      {/* Floating Buttons Container (Bottom Right) */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2.5 sm:gap-3">
        {/* Dark Mode Toggle */}
        <motion.button
          onClick={toggleDarkMode}
          whileHover={{ scale: 1.1, translateY: -2 }}
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-full bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-850 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-lg cursor-pointer backdrop-blur-md transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {isDarkMode ? <HiOutlineSun className="w-5 h-5 text-amber-500" /> : <HiOutlineMoon className="w-5 h-5 text-violet-600" />}
        </motion.button>

        {/* Back to Top */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              key="back-to-top"
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              whileHover={{ scale: 1.1, translateY: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollToTop}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 cursor-pointer"
              title="Back to Top"
            >
              <HiOutlineChevronUp className="w-5 h-5 stroke-[2.5px]" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
