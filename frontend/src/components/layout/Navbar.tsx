'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineMenuAlt3, HiX, HiOutlineUser, HiOutlineChatAlt2, HiOutlineMap, HiOutlineThumbUp, HiOutlineNewspaper } from 'react-icons/hi';
import { RiSparklingLine } from 'react-icons/ri';
import api from '@/lib/api';

const navLinks = [
  { href: '/', label: 'Home', icon: HiOutlineMap },
  { href: '/trips', label: 'Trips', icon: HiOutlineMap },
  { href: '/vote', label: 'Vote', icon: HiOutlineThumbUp },
  { href: '/blogs', label: 'Blog', icon: HiOutlineNewspaper },
  { href: '/ai', label: 'AI Planner', icon: RiSparklingLine },
  { href: '/trips', label: 'Chat Hub', icon: HiOutlineChatAlt2 },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);

    const fetchSettings = async () => {
      try {
        const data = await api.settings.getAll();
        setSettings(data || {});
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    };
    fetchSettings();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide the global public navbar on admin pages since they have their own dashboard layout
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'py-4 px-4 md:px-8' : 'py-0 px-0'
        }`}
      >
        <div 
          className={`max-w-7xl mx-auto px-4 md:px-8 transition-all duration-500 ${
            scrolled
              ? 'bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-2xl border border-slate-900/10 dark:border-white/10 rounded-2xl shadow-xl h-[4.5rem] flex items-center justify-between'
              : 'bg-transparent border-b border-transparent h-24 flex items-center justify-between'
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
              <img 
                src={settings.siteLogo || "/logo.png"} 
                alt={`${settings.siteName || "Mysuru Travel Club"} Logo`} 
                className="h-10 md:h-12 w-auto object-contain drop-shadow-md"
              />
            </div>
            <span className={`text-lg md:text-xl font-outfit font-black tracking-tight transition-colors duration-500 drop-shadow-sm ${
              scrolled ? 'text-slate-900 dark:text-white' : 'text-white'
            } group-hover:text-primary-500`}>
              {settings.siteName || "MYSURU TRAVEL CLUB"}
            </span>
          </Link>

          {/* Desktop Links */}
          <div className={`hidden md:flex items-center gap-1.5 p-1.5 rounded-2xl backdrop-blur-md transition-all duration-500 border ${
            scrolled 
              ? 'bg-slate-100/50 dark:bg-white/5 border-slate-200/50 dark:border-white/5 shadow-inner' 
              : 'bg-black/35 border-white/10 shadow-lg'
          }`}>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`relative px-5 py-2 text-sm font-bold tracking-wide transition-all duration-300 rounded-xl group overflow-hidden ${
                    isActive 
                      ? (scrolled 
                          ? 'text-primary-700 dark:text-primary-400 bg-white dark:bg-white/10 shadow-sm border border-slate-200/60 dark:border-white/10' 
                          : 'text-white bg-white/20 shadow-md border border-white/20')
                      : (scrolled 
                          ? 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5' 
                          : 'text-white/80 hover:text-white hover:bg-white/10')
                  }`}
                >
                  <span className="flex items-center gap-2 relative z-10">
                    <link.icon className={`w-4 h-4 transition-colors ${
                      isActive 
                        ? (scrolled ? 'text-primary-600 dark:text-primary-400' : 'text-white') 
                        : (scrolled ? 'text-slate-400 dark:text-slate-500 group-hover:text-primary-500' : 'text-white/60 group-hover:text-white')
                    }`} />
                    {link.label}
                  </span>
                  
                  {/* Subtle hover neon bar */}
                  {!isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[3px] bg-gradient-to-r from-primary-500 to-accent-cyan group-hover:w-1/2 transition-all duration-300 rounded-t-full opacity-70" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action Button */}
          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className={`hidden sm:flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-500 group ${
                scrolled
                  ? 'text-white bg-slate-900 hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/30'
                  : 'text-white bg-white/10 border border-white/10 hover:bg-white/20 hover:shadow-lg'
              }`}
            >
              <HiOutlineUser className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
              Admin Portal
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2.5 rounded-xl border transition-all shadow-sm ${
                scrolled
                  ? 'text-slate-650 bg-slate-50 hover:bg-slate-100 border-slate-200'
                  : 'text-white bg-black/35 hover:bg-black/55 border-white/10'
              }`}
            >
              {mobileOpen ? <HiX className="w-6 h-6" /> : <HiOutlineMenuAlt3 className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative pt-24 px-6 pb-8 space-y-3 border-b border-white/10 bg-slate-950/95 backdrop-blur-2xl shadow-2xl"
            >
              {navLinks.map((link, i) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-4 px-6 py-4 text-base font-bold rounded-2xl border transition-all ${
                        isActive 
                          ? 'text-white bg-primary-600/80 border-primary-500/50 shadow-md shadow-primary-500/10' 
                          : 'text-slate-300 hover:text-white bg-white/5 border-white/[0.03] hover:bg-white/10'
                      }`}
                    >
                      <link.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                <Link
                  href="/admin/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 mt-8 px-6 py-4 bg-white text-slate-950 font-bold rounded-2xl shadow-xl hover:bg-slate-100 transition-colors"
                >
                  <HiOutlineUser className="w-5 h-5" />
                  Admin Portal Login
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
